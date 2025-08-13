import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

type MigrationReturnType = {
  category: {
    totalProcessed: number;
    totalUpdated: number;
    totalErrors: number;
    lastProcessedUserId?: Id<"users">;
  };
  recurring: {
    totalProcessed: number;
    totalUpdated: number;
    totalErrors: number;
    lastProcessedId?: Id<"recurringTransactions">;
  };
};

// Run all migrations
export const runAll = internalMutation({
  args: {},
  returns: v.object({
    category: v.object({
      totalProcessed: v.number(),
      totalUpdated: v.number(),
      totalErrors: v.number(),
      lastProcessedUserId: v.optional(v.id("users")),
    }),
    recurring: v.object({
      totalProcessed: v.number(),
      totalUpdated: v.number(),
      totalErrors: v.number(),
      lastProcessedId: v.optional(v.id("recurringTransactions")),
    }),
    catchup: v.object({
      processedRecurring: v.number(),
      generatedTransactions: v.number(),
      batchesRun: v.number(),
    }),
  }),
  handler: async (ctx): Promise<MigrationReturnType> => {
    // Run category migration
    const categoryResults: {
      totalProcessed: number;
      totalUpdated: number;
      totalErrors: number;
      lastProcessedUserId?: Id<"users">;
    } = await ctx.runMutation(
      internal.migrations.category.runCategoryMigration,
      {}
    );

    // Run recurring nextDueDate backfill
    const recurringResults = await ctx.runMutation(
      internal.migrations.recurring.runRecurringNextDueDateMigration,
      {}
    );

    const catchupResults = await ctx.runAction(
      internal.migrations.recurring.runRecurringCatchup,
      {}
    );

    return {
      category: categoryResults,
      recurring: recurringResults,
      catchup: catchupResults,
    };
  },
}); 