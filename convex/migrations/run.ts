import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

interface MigrationResults {
  totalProcessed: number;
  totalUpdated: number;
  totalErrors: number;
  lastProcessedUserId?: Id<"users">;
}

export const runAllMigrations = internalMutation({
  args: {},
  returns: v.object({
    totalProcessed: v.number(),
    totalUpdated: v.number(),
    totalErrors: v.number(),
    lastProcessedUserId: v.optional(v.id("users")),
  }),
  handler: async (ctx: MutationCtx): Promise<MigrationResults> => {
    console.log("Starting category migration...");

    const results: MigrationResults = await ctx.runMutation(
      internal.migrations.category.runCategoryMigration,
      {}
    );

    console.log("Migration completed with results:", results);
    return results;
  },
}); 