import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";

// Helper function to find or create category
async function findOrCreateCategory(
  ctx: MutationCtx,
  name: string,
  userId: Id<"users">
): Promise<Id<"categories">> {
  // First try to find existing category (case-insensitive)
  const existingCategory = await ctx.db
    .query("categories")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("name"), name))
    .first();

  if (existingCategory) {
    return existingCategory._id;
  }

  // If not found, create new category
  return await ctx.db.insert("categories", {
    name,
    userId,
    softdelete: false,
  });
}

interface MigrationBatchResult {
  processed: number;
  updated: number;
  errors: number;
  hasMore: boolean;
}

// Migration function to update expenses with categoryId
export const migrateExpenseCategories = internalMutation({
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

    // Get all expenses that need migration (have category but no categoryId)
    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => 
        q.and(
          q.neq(q.field("category"), undefined),
          q.eq(q.field("categoryId"), undefined)
        )
      )
      .take(batchSize);

    for (const expense of expenses) {
      try {
        if (!expense.category) continue;

        const categoryId = await findOrCreateCategory(
          ctx,
          expense.category,
          expense.userId
        );

        // Update expense with categoryId
        await ctx.db.patch(expense._id, {
          categoryId,
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
export const runExpenseCategoryMigration = internalMutation({
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
      const batchResult = await ctx.runMutation(internal.migrations.expenseCategory.migrateExpenseCategories, {
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