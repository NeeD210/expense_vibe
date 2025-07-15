import { internalMutation } from "./_generated/server";

// Migration to remove nextDueDate field from recurring transactions
export const removeNextDueDateField = internalMutation({
  handler: async (ctx) => {
    // Get all recurring transactions
    const transactions = await ctx.db
      .query("recurringTransactions")
      .collect();

    // Update each transaction to remove nextDueDate field
    for (const transaction of transactions) {
      // Use type assertion since we know nextDueDate exists in the database
      const { nextDueDate, ...rest } = transaction as any;
      await ctx.db.patch(transaction._id, rest);
    }
  },
}); 