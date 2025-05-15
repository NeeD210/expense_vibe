import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

// Import all migrations
import * as paymentTypeMigration from "./paymentType";
import * as categoryMigration from "./category";

type MigrationReturnType = {
  paymentType: {
    totalProcessed: number;
    totalUpdated: number;
    totalErrors: number;
  };
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
    paymentType: v.object({
      totalProcessed: v.number(),
      totalUpdated: v.number(),
      totalErrors: v.number(),
    }),
    category: v.object({
      totalProcessed: v.number(),
      totalUpdated: v.number(),
      totalErrors: v.number(),
      lastProcessedUserId: v.optional(v.id("users")),
    }),
  }),
  handler: async (ctx): Promise<MigrationReturnType> => {
    // Run payment type migration
    const paymentTypeResults: {
      totalProcessed: number;
      totalUpdated: number;
      totalErrors: number;
    } = await ctx.runMutation(
      internal.migrations.paymentType.runPaymentTypeMigration,
      {}
    );

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
      paymentType: paymentTypeResults,
      category: categoryResults,
    };
  },
}); 