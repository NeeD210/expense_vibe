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

    return {
      category: categoryResults,
    };
  },
}); 