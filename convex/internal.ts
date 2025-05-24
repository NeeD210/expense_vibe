import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Internal query to get recurring transactions that need to be processed
export const getRecurringTransactionsToProcess = internalQuery({
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

// Internal mutation to generate a transaction from a recurring transaction
export const generateTransactionFromRecurring = internalMutation({
  args: {
    recurringTransactionId: v.id("recurringTransactions"),
    targetDate: v.optional(v.number()),
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

    // Get the payment type
    const paymentType = recurringTransaction.paymentTypeId ? await ctx.db.get(recurringTransaction.paymentTypeId) : null;
    if (recurringTransaction.paymentTypeId && !paymentType) {
      throw new Error("Payment type not found");
    }

    const transactionDate = args.targetDate ?? Date.now();

    // Calculate next due date using the same logic as addExpense
    const nextDueDate = recurringTransaction.paymentTypeId ? 
      await calculateNextDueDate(ctx, transactionDate, recurringTransaction.paymentTypeId) : 
      undefined;

    // Create the transaction
    const transactionId = await ctx.db.insert("expenses", {
      userId: recurringTransaction.userId,
      description: recurringTransaction.description,
      amount: recurringTransaction.amount,
      category: category.name,
      categoryId: recurringTransaction.categoryId,
      paymentTypeId: recurringTransaction.paymentTypeId,
      transactionType: recurringTransaction.transactionType,
      date: transactionDate,
      cuotas: recurringTransaction.cuotas ?? 1,
      verified: false,
      recurringTransactionId: args.recurringTransactionId,
      softdelete: false,
      nextDueDate,
    });

    // Update the last processed date
    await ctx.db.patch(args.recurringTransactionId, {
      lastProcessedDate: transactionDate,
    });

    // Generate payment schedules if payment type exists
    if (recurringTransaction.paymentTypeId && nextDueDate) {
      await ctx.runMutation(internal.internal.expenses.generatePaymentSchedules, {
        paymentTypeId: recurringTransaction.paymentTypeId,
        userId: recurringTransaction.userId,
        expenseId: transactionId,
        totalInstallments: recurringTransaction.cuotas ?? 1,
        firstDueDate: nextDueDate,
        totalAmount: recurringTransaction.amount,
      });
    }

    return transactionId;
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

// Helper function to calculate next due date based on payment type
async function calculateNextDueDate(ctx: any, date: number, paymentTypeId: Id<"paymentTypes">): Promise<number> {
  const paymentType = await ctx.db.get(paymentTypeId);
  if (!paymentType) throw new Error("Payment type not found");

  if (!paymentType.isCredit || !paymentType.closingDay || !paymentType.dueDay) {
    return date;
  }

  const transactionDate = new Date(date);
  const closingDay = paymentType.closingDay;
  const dueDay = paymentType.dueDay;

  // Step 1: Determine the Closing Date of the Billing Cycle
  let effectiveClosingDate: Date;
  const transactionDay = transactionDate.getDate();
  const transactionMonth = transactionDate.getMonth();
  const transactionYear = transactionDate.getFullYear();

  // First, calculate what would be the closing date in the current month
  const currentMonthClosingDate = new Date(transactionYear, transactionMonth, closingDay);
  
  // If the transaction is before or on the current month's closing date,
  // it belongs to the current billing cycle
  if (transactionDate <= currentMonthClosingDate) {
    effectiveClosingDate = currentMonthClosingDate;
  } else {
    // Otherwise, it belongs to next month's billing cycle
    let nextMonth = transactionMonth + 1;
    let nextYear = transactionYear;
    
    // Handle December to January transition
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    
    effectiveClosingDate = new Date(nextYear, nextMonth, closingDay);
  }

  // Step 2: Calculate the Payment Due Date
  let dueMonth = effectiveClosingDate.getMonth();
  let dueYear = effectiveClosingDate.getFullYear();

  // If due day is after closing day, the due date is in the same month as the closing date
  // If due day is before closing day, the due date is in the next month
  if (dueDay < closingDay) {
    dueMonth += 1;
    // Handle December to January transition
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
  }

  // Create the final due date and add one day
  const nextDueDate = new Date(dueYear, dueMonth, dueDay);
  nextDueDate.setDate(nextDueDate.getDate() + 1);
  return nextDueDate.getTime();
} 