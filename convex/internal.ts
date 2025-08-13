import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { stepDateByFrequency } from "./lib/scheduling";

// Internal query to get recurring transactions that need to be processed
export const getRecurringTransactionsToProcess = internalQuery({
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_isActive_nextDueDate", (q) => q.eq("isActive", true))
      .filter((q) => q.eq(q.field("softdelete"), false))
      .filter((q) => q.lte(q.field("nextDueDate"), now))
      .take(200);
    return due;
  },
});

// Internal mutation to generate a transaction from a recurring transaction
export const generateTransactionFromRecurring = internalMutation({
  args: {
    recurringTransactionId: v.id("recurringTransactions"),
    targetDate: v.number(),
  },
  handler: async (ctx, args) => {
    const recurringTransaction = await ctx.db.get(args.recurringTransactionId);
    if (!recurringTransaction) {
      throw new Error("Recurring transaction not found");
    }

    // Respect boundaries
    if (args.targetDate < recurringTransaction.startDate) {
      throw new Error("Target date before startDate");
    }
    if (recurringTransaction.endDate && args.targetDate > recurringTransaction.endDate) {
      await ctx.db.patch(args.recurringTransactionId, { isActive: false, nextDueDate: undefined });
      throw new Error("Recurring transaction past endDate; deactivated");
    }

    const category = await ctx.db.get(recurringTransaction.categoryId);
    if (!category) throw new Error("Category not found");

    // Idempotency: avoid duplicates for same recurringId+date
    const existing = await ctx.db
      .query("expenses")
      .withIndex("by_recurringTransactionId", (q) => q.eq("recurringTransactionId", args.recurringTransactionId))
      .filter((q) => q.eq(q.field("date"), args.targetDate))
      .first();
    if (existing) return existing._id;

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

    const anchorDay = new Date(recurringTransaction.startDate).getDate();
    const advancedNext = stepDateByFrequency(args.targetDate, recurringTransaction.frequency as any, anchorDay);
    await ctx.db.patch(args.recurringTransactionId, {
      lastProcessedDate: args.targetDate,
      nextDueDate: advancedNext,
    });

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

// Removed legacy helpers; nextDueDate progression is handled by frequency stepping