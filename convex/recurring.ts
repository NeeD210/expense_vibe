import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { addDays, addMonths, addWeeks, addYears, setDate } from "date-fns";
import { internalMutation } from "./_generated/server";
import { internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

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
    paymentTypeId: v.id("paymentTypes"),
    transactionType: v.string(),
    frequency: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    nextDueDateCalculationDay: v.optional(v.number()),
    cuotas: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate frequency
    if (!["daily", "weekly", "monthly", "yearly"].includes(args.frequency)) {
      throw new Error("Invalid frequency. Must be daily, weekly, monthly, or yearly.");
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
      isActive: args.isActive ?? true,
      softdelete: false,
      cuotas: args.cuotas ?? 1,
    });

    // Generate transactions for past dates
    const currentDate = Date.now();
    let currentDateToProcess = args.startDate;
    
    while (currentDateToProcess <= currentDate) {
      // Generate transaction for this date
      await ctx.runMutation(internal.internal.generateTransactionFromRecurring, {
        recurringTransactionId,
        targetDate: currentDateToProcess,
      });

      // Calculate next date based on frequency
      const nextDate = new Date(currentDateToProcess);
      switch (args.frequency) {
        case "daily":
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case "weekly":
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case "monthly":
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case "yearly":
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
      currentDateToProcess = nextDate.getTime();
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
    if (args.frequency && !["daily", "weekly", "monthly", "yearly"].includes(args.frequency)) {
      throw new Error("Invalid frequency. Must be daily, weekly, monthly, or yearly.");
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

    // Create update object with only provided fields
    const updates: any = {};
    for (const [key, value] of Object.entries(args)) {
      if (key !== "id" && value !== undefined) {
        updates[key] = value;
      }
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
    case "yearly":
      return new Date(now.setFullYear(now.getFullYear() - 1)).getTime();
    default:
      return 0;
  }
}

export const getRecurringTransactionsToProcess = query({
  handler: async (ctx) => {
    const currentTimestamp = Date.now();
    
    return await ctx.db
      .query("recurringTransactions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .filter((q) => q.eq(q.field("softdelete"), false))
      .filter((q) => {
        const frequency = q.field("frequency") as unknown as string;
        const threshold = determineLastProcessingThreshold(frequency, currentTimestamp);
        return q.lt(q.field("lastProcessedDate"), threshold);
      })
      .collect();
  },
});

export const generateTransactionFromRecurring = mutation({
  args: {
    recurringTransactionId: v.id("recurringTransactions"),
  },
  handler: async (ctx, args) => {
    const recurringTransaction = await ctx.db.get(args.recurringTransactionId);
    if (!recurringTransaction) {
      throw new Error("Recurring transaction not found");
    }

    // Get the category to include category name
    const category = await ctx.db.get(recurringTransaction.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Create the transaction
    const transactionId = await ctx.db.insert("expenses", {
      userId: recurringTransaction.userId,
      description: recurringTransaction.description,
      amount: recurringTransaction.amount,
      category: category.name,
      categoryId: recurringTransaction.categoryId,
      paymentTypeId: recurringTransaction.paymentTypeId,
      transactionType: recurringTransaction.transactionType,
      date: Date.now(),
      cuotas: recurringTransaction.cuotas,
      verified: false,
      recurringTransactionId: args.recurringTransactionId,
      softdelete: false,
    });

    // Update the last processed date
    await ctx.db.patch(args.recurringTransactionId, {
      lastProcessedDate: Date.now(),
    });

    // If this is an installment payment, generate the payment schedules
    if (recurringTransaction.cuotas > 1) {
      await ctx.runMutation(internal.internal.expenses.generatePaymentSchedules, {
        paymentTypeId: recurringTransaction.paymentTypeId,
        userId: recurringTransaction.userId,
        expenseId: transactionId,
        totalInstallments: recurringTransaction.cuotas,
        firstDueDate: Date.now(),
        totalAmount: recurringTransaction.amount,
      });
    }

    return transactionId;
  },
}); 