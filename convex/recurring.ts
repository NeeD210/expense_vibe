import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { initializeNextDueDate, stepDateByFrequency } from "./lib/scheduling";

// Helper function to get the authenticated user's ID
async function getAuthenticatedUserId(ctx: { auth: { getUserIdentity: () => Promise<any> }, db: any }): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("auth0Id"), identity.subject))
    .first();

  return user?._id ?? null;
}

// Add a new recurring transaction
export const addRecurringTransaction = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    categoryId: v.id("categories"),
    paymentTypeId: v.optional(v.id("paymentTypes")),
    transactionType: v.string(),
    frequency: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    nextDueDateCalculationDay: v.optional(v.number()),
    cuotas: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    console.log('addRecurringTransaction nextDueDateCalculationDay:', args.nextDueDateCalculationDay); // Debug log
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate frequency
    if (!["daily", "weekly", "monthly", "semestrally", "yearly"].includes(args.frequency)) {
      throw new Error("Invalid frequency. Must be daily, weekly, monthly, semestrally, or yearly.");
    }

    // Validate transaction type
    if (!["expense", "income"].includes(args.transactionType)) {
      throw new Error("Invalid transaction type. Must be expense or income.");
    }

    // Validate nextDueDateCalculationDay if provided
    if (args.nextDueDateCalculationDay !== undefined) {
      if (args.nextDueDateCalculationDay < 1 || args.nextDueDateCalculationDay > 31) {
        throw new Error("nextDueDateCalculationDay must be between 1 and 31");
      }
    }

    // Create the recurring transaction
    const now = Date.now();
    const initialNextDueDate = initializeNextDueDate(args.startDate, now, args.frequency as any);

    const recurringTransactionId = await ctx.db.insert("recurringTransactions", {
      userId,
      description: args.description,
      amount: args.amount,
      categoryId: args.categoryId,
      paymentTypeId: args.paymentTypeId,
      transactionType: args.transactionType,
      frequency: args.frequency,
      startDate: args.startDate,
      endDate: args.endDate,
      lastProcessedDate: undefined,
      nextDueDateCalculationDay: args.nextDueDateCalculationDay,
      nextDueDate: initialNextDueDate,
      isActive: args.isActive ?? true,
      softdelete: false,
      cuotas: args.cuotas ?? 1,
    });

    // Backfill only if startDate is in the past: repeatedly generate for due dates < now
    let targetDate = args.startDate;
    const anchorDay = new Date(args.startDate).getDate();
    while (targetDate <= now && (!args.endDate || targetDate <= args.endDate)) {
      await ctx.runMutation(internal.internal.generateTransactionFromRecurring, {
        recurringTransactionId,
        targetDate,
      });
      targetDate = stepDateByFrequency(targetDate, args.frequency as any, anchorDay);
    }

    return recurringTransactionId;
  },
});

// Update an existing recurring transaction
export const updateRecurringTransaction = mutation({
  args: {
    id: v.id("recurringTransactions"),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    paymentTypeId: v.optional(v.id("paymentTypes")),
    transactionType: v.optional(v.string()),
    frequency: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    nextDueDateCalculationDay: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    cuotas: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the existing recurring transaction
    const recurringTransaction = await ctx.db.get(args.id);
    if (!recurringTransaction || recurringTransaction.userId !== userId) {
      throw new Error("Recurring transaction not found");
    }

    // Validate frequency if provided
    if (args.frequency && !["daily", "weekly", "monthly", "semestrally", "yearly"].includes(args.frequency)) {
      throw new Error("Invalid frequency. Must be daily, weekly, monthly, semestrally, or yearly.");
    }

    // Validate transaction type if provided
    if (args.transactionType && !["expense", "income"].includes(args.transactionType)) {
      throw new Error("Invalid transaction type. Must be expense or income.");
    }

    // Validate nextDueDateCalculationDay if provided
    if (args.nextDueDateCalculationDay !== undefined) {
      if (args.nextDueDateCalculationDay < 1 || args.nextDueDateCalculationDay > 31) {
        throw new Error("nextDueDateCalculationDay must be between 1 and 31");
      }
    }

    // Build updates and recompute nextDueDate if frequency/startDate changed
    const updates: any = {};
    for (const [key, value] of Object.entries(args)) {
      if (key !== "id" && value !== undefined) updates[key] = value;
    }
    if (updates.startDate || updates.frequency) {
      const startDate = (updates.startDate ?? recurringTransaction.startDate) as number;
      const frequency = (updates.frequency ?? recurringTransaction.frequency) as any;
      const now = Date.now();
      updates.nextDueDate = initializeNextDueDate(startDate, now, frequency);
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

// Delete (soft-delete) a recurring transaction
export const deleteRecurringTransaction = mutation({
  args: {
    id: v.id("recurringTransactions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recurringTransaction = await ctx.db.get(args.id);
    if (!recurringTransaction || recurringTransaction.userId !== userId) {
      throw new Error("Recurring transaction not found");
    }

    await ctx.db.patch(args.id, { softdelete: true });
    return args.id;
  },
});

// Toggle active status for a recurring transaction
export const toggleRecurringTransactionStatus = mutation({
  args: {
    id: v.id("recurringTransactions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recurringTransaction = await ctx.db.get(args.id);
    if (!recurringTransaction || recurringTransaction.userId !== userId) {
      throw new Error("Recurring transaction not found");
    }

    await ctx.db.patch(args.id, { isActive: !recurringTransaction.isActive });
    return args.id;
  },
});

// Get all recurring transactions for the current user
export const listRecurringTransactions = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("recurringTransactions")
      .withIndex("by_user_isActive_startDate", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("softdelete"), false))
      .collect();
  },
});

// Helper function to determine the last processing threshold based on frequency
function determineLastProcessingThreshold(frequency: string, currentTimestamp: number): number {
  const now = new Date(currentTimestamp);
  switch (frequency) {
    case "daily":
      return new Date(now.setDate(now.getDate() - 1)).getTime();
    case "weekly":
      return new Date(now.setDate(now.getDate() - 7)).getTime();
    case "monthly":
      return new Date(now.setMonth(now.getMonth() - 1)).getTime();
    case "semestrally":
      return new Date(now.setMonth(now.getMonth() - 6)).getTime();
    case "yearly":
      return new Date(now.setFullYear(now.getFullYear() - 1)).getTime();
    default:
      return 0;
  }
}

export const getRecurringTransactionsToProcess = query({
  handler: async (ctx) => {
    const now = Date.now();
    // Use nextDueDate-based detection in small batches
    const batch = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_isActive_nextDueDate", (q) => q.eq("isActive", true))
      .filter((q) => q.eq(q.field("softdelete"), false))
      .filter((q) => q.lte(q.field("nextDueDate"), now))
      .take(200);
    return batch;
  },
});

export const generateTransactionFromRecurring = mutation({
  args: {
    recurringTransactionId: v.id("recurringTransactions"),
    targetDate: v.number(),
  },
  handler: async (ctx, args) => {
    const recurringTransaction = await ctx.db.get(args.recurringTransactionId);
    if (!recurringTransaction) {
      throw new Error("Recurring transaction not found");
    }

    // Respect boundaries: do not generate outside start/end window
    if (args.targetDate < recurringTransaction.startDate) {
      throw new Error("Target date before startDate");
    }
    if (recurringTransaction.endDate && args.targetDate > recurringTransaction.endDate) {
      // Deactivate and stop further processing
      await ctx.db.patch(args.recurringTransactionId, { isActive: false, nextDueDate: undefined });
      throw new Error("Recurring transaction past endDate; deactivated");
    }

    // Get the category to include category name
    const category = await ctx.db.get(recurringTransaction.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Idempotency: avoid duplicates for same recurringId + date
    const existing = await ctx.db
      .query("expenses")
      .withIndex("by_recurringTransactionId", (q) => q.eq("recurringTransactionId", args.recurringTransactionId))
      .filter((q) => q.eq(q.field("date"), args.targetDate))
      .first();
    if (existing) {
      return existing._id;
    }

    // Create the transaction at the scheduled targetDate
    const transactionId = await ctx.db.insert("expenses", {
      userId: recurringTransaction.userId,
      description: recurringTransaction.description,
      amount: recurringTransaction.amount,
      category: category.name,
      categoryId: recurringTransaction.categoryId,
      paymentTypeId: recurringTransaction.paymentTypeId,
      transactionType: recurringTransaction.transactionType,
      date: args.targetDate,
      cuotas: recurringTransaction.cuotas ?? 1,
      verified: false,
      recurringTransactionId: args.recurringTransactionId,
      softdelete: false,
    });

    // Update processing markers: lastProcessedDate and advance nextDueDate
    const anchorDay = new Date(recurringTransaction.startDate).getDate();
    const advancedNext = stepDateByFrequency(args.targetDate, recurringTransaction.frequency as any, anchorDay);
    await ctx.db.patch(args.recurringTransactionId, {
      lastProcessedDate: args.targetDate,
      nextDueDate: advancedNext,
    });

    // If this is an installment payment and has a payment type, generate the payment schedules
    if ((recurringTransaction.cuotas ?? 1) > 1 && recurringTransaction.paymentTypeId) {
      await ctx.runMutation(internal.internal.expenses.generatePaymentSchedules, {
        paymentTypeId: recurringTransaction.paymentTypeId,
        userId: recurringTransaction.userId,
        expenseId: transactionId,
        totalInstallments: recurringTransaction.cuotas ?? 1,
        firstDueDate: args.targetDate,
        totalAmount: recurringTransaction.amount,
      });
    }

    return transactionId;
  },
}); 