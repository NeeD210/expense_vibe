import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";

// Helper function to find or create payment type
async function findOrCreatePaymentType(
  ctx: MutationCtx,
  name: string,
  userId: Id<"users">
): Promise<Id<"paymentTypes">> {
  // First try to find existing payment type
  const existingPaymentType = await ctx.db
    .query("paymentTypes")
    .withIndex("by_user_softdelete", (q) => 
      q.eq("userId", userId).eq("softdelete", false)
    )
    .filter((q) => q.eq(q.field("name"), name))
    .first();

  if (existingPaymentType) {
    return existingPaymentType._id;
  }

  // If not found, create new payment type
  return await ctx.db.insert("paymentTypes", {
    name,
    userId,
  });
}

interface MigrationBatchResult {
  processed: number;
  updated: number;
  errors: number;
  hasMore: boolean;
}

// Migration function to update expenses with paymentTypeId
export const migratePaymentTypes = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    processed: v.number(),
    updated: v.number(),
    errors: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args): Promise<MigrationBatchResult> => {
    const batchSize = args.batchSize ?? 100;
    let processed = 0;
    let updated = 0;
    let errors = 0;

    // Get all expenses that need migration (have paymentType but no paymentTypeId)
    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => 
        q.and(
          q.neq(q.field("paymentType"), undefined),
          q.eq(q.field("paymentTypeId"), undefined)
        )
      )
      .take(batchSize);

    for (const expense of expenses) {
      try {
        if (!expense.paymentType) continue;

        const paymentTypeId = await findOrCreatePaymentType(
          ctx,
          expense.paymentType,
          expense.userId
        );

        // Update expense with paymentTypeId
        await ctx.db.patch(expense._id, {
          paymentTypeId,
        });

        updated++;
      } catch (error) {
        console.error(`Error migrating expense ${expense._id}:`, error);
        errors++;
      }
      processed++;
    }

    return {
      processed,
      updated,
      errors,
      hasMore: expenses.length === batchSize,
    };
  },
});

interface MigrationResults {
  totalProcessed: number;
  totalUpdated: number;
  totalErrors: number;
}

// Function to run the migration in batches
export const runPaymentTypeMigration = internalMutation({
  args: {},
  returns: v.object({
    totalProcessed: v.number(),
    totalUpdated: v.number(),
    totalErrors: v.number(),
  }),
  handler: async (ctx): Promise<MigrationResults> => {
    const results: MigrationResults = {
      totalProcessed: 0,
      totalUpdated: 0,
      totalErrors: 0,
    };

    let hasMore = true;
    while (hasMore) {
      const batchResult = await ctx.runMutation(internal.migrations.paymentType.migratePaymentTypes, {
        batchSize: 100,
      });

      results.totalProcessed += batchResult.processed;
      results.totalUpdated += batchResult.updated;
      results.totalErrors += batchResult.errors;
      hasMore = batchResult.hasMore;
    }

    return results;
  },
}); 