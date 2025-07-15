import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { cache, CACHE_DURATION, CACHE_KEYS } from "./cache";
import type { QueryCtx, DatabaseReader } from "./_generated/server";

// Helper function to get the authenticated user's ID
async function getAuthenticatedUserId(ctx: { auth: { getUserIdentity: () => Promise<any> }, db: DatabaseReader }): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("auth0Id"), identity.subject))
    .first();

  return user?._id ?? null;
}

// Common interface for projection items
interface ProjectionItem {
  date: number;
  amount: number;
  description: string;
  type: "installment" | "recurring";
  originalExpenseId?: Id<"expenses">;
  recurringTransactionId?: Id<"recurringTransactions">;
  categoryId: Id<"categories"> | Id<"paymentTypes">;
  paymentTypeId?: Id<"paymentTypes">;
  transactionType?: string;
}

interface Expense {
  _id: Id<"expenses">;
  _creationTime: number;
  amount: number;
  category: string;
  categoryId?: Id<"categories">;
  cuotas: number;
  date: number;
  description: string;
  paymentType?: string;
  paymentTypeId?: Id<"paymentTypes">;
  transactionType: string;
  userId: Id<"users">;
  deletedAt?: number;
  softdelete?: boolean;
  verified?: boolean;
  recurringTransactionId?: Id<"recurringTransactions">;
  nextDueDate?: number;
}

interface PaymentSchedule {
  expenseId: Id<"expenses">;
  dueDate: number;
  amount: number;
  paymentTypeId: Id<"paymentTypes">;
}

interface RecurringTransaction {
  _id: Id<"recurringTransactions">;
  userId: Id<"users">;
  description: string;
  amount: number;
  frequency: string;
  startDate: number;
  endDate?: number;
  lastProcessedDate?: number;
  categoryId: Id<"categories">;
  paymentTypeId?: Id<"paymentTypes">;
  transactionType?: string;
  isActive: boolean;
}

export const getProjectedPayments = query({
  args: {},
  returns: v.array(v.object({
    date: v.number(),
    amount: v.number(),
    description: v.string(),
    type: v.union(v.literal("installment"), v.literal("recurring")),
    originalExpenseId: v.optional(v.id("expenses")),
    recurringTransactionId: v.optional(v.id("recurringTransactions")),
    categoryId: v.union(v.id("categories"), v.id("paymentTypes")),
    paymentTypeId: v.optional(v.id("paymentTypes")),
    transactionType: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate date range for projections
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const dateRangeStart = startOfMonth.getTime();
    const endOf4thMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 4, 0, 23, 59, 59, 999);
    const dateRangeEnd = endOf4thMonth.getTime();

    // Calculate all projections (no pagination)
    const allItems = await calculateProjections(ctx, userId, dateRangeStart, dateRangeEnd);
    return allItems;
  },
});

// Helper function to calculate projections
async function calculateProjections(
  ctx: QueryCtx,
  userId: Id<"users">,
  dateRangeStart: number,
  dateRangeEnd: number
): Promise<ProjectionItem[]> {
  // 1. Get payment schedules with optimized filtering using compound index
  const paymentSchedules = await ctx.db
    .query("paymentSchedules")
    .withIndex("by_user_dueDate_softdelete", (q) =>
      q.eq("userId", userId)
       .gte("dueDate", dateRangeStart)
       .lte("dueDate", dateRangeEnd)
    )
    .filter((q) => q.eq(q.field("softdelete"), false))
    .collect();
  
  // 2. Get all related expenses in a single batch query
  const expenseIds = [...new Set(paymentSchedules.map((ps: PaymentSchedule) => ps.expenseId))];
  const expenses = await Promise.all(
    expenseIds.map((id) => ctx.db.get(id))
  );

  // Create a map for faster expense lookups
  const expenseMap = new Map(
    expenses
      .filter((e): e is Expense => e !== null && e !== undefined)
      .map((e): [Id<"expenses">, Expense] => [e._id, e])
  );

  // 3. Map payment schedules to projection items with optimized lookup
  const installmentItems: ProjectionItem[] = paymentSchedules.map((schedule: PaymentSchedule) => {
    const expense = expenseMap.get(schedule.expenseId);
    return {
      date: schedule.dueDate,
      amount: schedule.amount,
      description: expense?.description ?? "Unknown Expense",
      type: "installment",
      originalExpenseId: schedule.expenseId,
      categoryId: expense?.categoryId ?? schedule.paymentTypeId,
      paymentTypeId: schedule.paymentTypeId,
      transactionType: expense?.transactionType,
    };
  });

  // 4. Get recurring transactions with optimized filtering
  const recurringTransactions = await ctx.db
    .query("recurringTransactions")
    .withIndex("by_user_isActive_softdelete", (q) =>
      q.eq("userId", userId)
       .eq("isActive", true)
    )
    .filter((q) => q.eq(q.field("softdelete"), false))
    .filter((q) => q.lte(q.field("startDate"), dateRangeEnd))
    .collect();

  // 5. Generate recurring items with optimized date calculations
  const recurringItems: ProjectionItem[] = [];
  
  // Pre-calculate frequency multipliers and date ranges for all frequencies
  const frequencyMultipliers = new Map<string, { unit: 'days' | 'months' | 'years', value: number }>();
  const dateRanges = new Map<string, { start: number, end: number }>();
  
  for (const rt of recurringTransactions) {
    if (!frequencyMultipliers.has(rt.frequency)) {
      frequencyMultipliers.set(rt.frequency, getFrequencyMultiplier(rt.frequency));
    }
    
    // Pre-calculate date ranges for each transaction
    const startDate = rt.lastProcessedDate && rt.lastProcessedDate > rt.startDate
      ? getNextDate(rt.lastProcessedDate, rt.frequency)
      : rt.startDate;
    const endDate = rt.endDate ?? dateRangeEnd;
    
    dateRanges.set(rt._id, {
      start: Math.max(startDate, dateRangeStart),
      end: Math.min(endDate, dateRangeEnd)
    });
  }

  // Process recurring transactions in batches for better performance
  const BATCH_SIZE = 10;
  for (let i = 0; i < recurringTransactions.length; i += BATCH_SIZE) {
    const batch = recurringTransactions.slice(i, i + BATCH_SIZE);
    
    for (const rt of batch) {
      const multiplier = frequencyMultipliers.get(rt.frequency)!;
      const { start, end } = dateRanges.get(rt._id)!;
      
      // Pre-calculate the number of iterations needed
      const iterations = Math.ceil((end - start) / (multiplier.value * 24 * 60 * 60 * 1000));
      
      // Generate items in bulk with pre-allocated array
      const items = new Array<ProjectionItem>();
      let currentDate = start;
      
      for (let j = 0; j < iterations && currentDate <= end; j++) {
        items.push({
          date: currentDate,
          amount: rt.amount,
          description: rt.description,
          type: "recurring",
          recurringTransactionId: rt._id,
          categoryId: rt.categoryId,
          paymentTypeId: rt.paymentTypeId,
          transactionType: rt.transactionType,
        });
        currentDate = addTimeToDate(currentDate, multiplier);
      }
      recurringItems.push(...items);
    }
  }

  // 6. Combine and sort all items
  return [...installmentItems, ...recurringItems].sort((a, b) => a.date - b.date);
}

// Helper function to get frequency multiplier for faster date calculations
function getFrequencyMultiplier(frequency: string): { unit: 'days' | 'months' | 'years', value: number } {
  switch (frequency) {
    case "daily":
      return { unit: 'days', value: 1 };
    case "weekly":
      return { unit: 'days', value: 7 };
    case "monthly":
      return { unit: 'months', value: 1 };
    case "semestrally":
      return { unit: 'months', value: 6 };
    case "yearly":
      return { unit: 'years', value: 1 };
    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
  }
}

// Optimized date calculation function
function addTimeToDate(date: number, multiplier: { unit: 'days' | 'months' | 'years', value: number }): number {
  const result = new Date(date);
  switch (multiplier.unit) {
    case 'days':
      result.setDate(result.getDate() + multiplier.value);
      break;
    case 'months':
      result.setMonth(result.getMonth() + multiplier.value);
      break;
    case 'years':
      result.setFullYear(result.getFullYear() + multiplier.value);
      break;
  }
  return result.getTime();
}

// Helper function to get next date based on frequency
function getNextDate(date: number, frequency: string): number {
  const result = new Date(date);
  switch (frequency) {
    case "daily":
      result.setDate(result.getDate() + 1);
      break;
    case "weekly":
      result.setDate(result.getDate() + 7);
      break;
    case "monthly":
      result.setMonth(result.getMonth() + 1);
      break;
    case "semestrally":
      result.setMonth(result.getMonth() + 6);
      break;
    case "yearly":
      result.setFullYear(result.getFullYear() + 1);
      break;
    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
  }
  return result.getTime();
} 