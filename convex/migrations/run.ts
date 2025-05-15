import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { MutationCtx } from "../_generated/server";

interface MigrationResults {
  totalProcessed: number;
  totalUpdated: number;
  totalErrors: number;
}

export const runAllMigrations = internalMutation({
  args: {},
  returns: v.object({
    totalProcessed: v.number(),
    totalUpdated: v.number(),
    totalErrors: v.number(),
  }),
  handler: async (ctx: MutationCtx): Promise<MigrationResults> => {
    console.log("Starting payment type migration...");
    
    const results: MigrationResults = await ctx.runMutation(
      internal.migrations.paymentType.runPaymentTypeMigration,
      {}
    );

    console.log("Migration completed with results:", results);
    return results;
  },
}); 