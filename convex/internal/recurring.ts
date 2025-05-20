import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

// Internal action to process recurring transactions
export const processRecurringTransactions = internalAction({
  handler: async (ctx) => {
    const transactions = await ctx.runQuery(internal.internal.getRecurringTransactionsToProcess);
    
    for (const transaction of transactions) {
      try {
        await ctx.runMutation(internal.internal.generateTransactionFromRecurring, {
          recurringTransactionId: transaction._id,
        });
      } catch (error) {
        console.error("Error processing recurring transaction:", error);
      }
    }
  },
}); 