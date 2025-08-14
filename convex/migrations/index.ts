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
  // catch-up run is executed separately as an action
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

    return {
      category: categoryResults,
      recurring: recurringResults,
    };
  },
}); 