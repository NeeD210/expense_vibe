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
  lastProcessedUserId?: Id<"users">;
}

// Migration function to process a batch of expenses
export const migrateCategories = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    lastProcessedUserId: v.optional(v.id("users")),
  },
  returns: v.object({
    processed: v.number(),
    updated: v.number(),
    errors: v.number(),
    hasMore: v.boolean(),
    lastProcessedUserId: v.optional(v.id("users")),
  }),
  handler: async (ctx, args): Promise<MigrationBatchResult> => {
    const batchSize = args.batchSize ?? 50;
    let processed = 0;
    let updated = 0;
    let errors = 0;
    let lastProcessedUserId: Id<"users"> | undefined = args.lastProcessedUserId;

    try {
      // Get expenses that need migration
      const expenses = await ctx.db
        .query("expenses")
        .filter((q) => !lastProcessedUserId || q.gt(q.field("userId"), lastProcessedUserId))
        .take(batchSize);

      for (const expense of expenses) {
        try {
          if (!expense.category) continue;

          await findOrCreateCategory(ctx, expense.category, expense.userId);
          updated++;
          lastProcessedUserId = expense.userId;
        } catch (error) {
          console.error(`Error processing expense ${expense._id}:`, error);
          errors++;
        }
        processed++;
      }

      return {
        processed,
        updated,
        errors,
        hasMore: expenses.length === batchSize,
        lastProcessedUserId,
      };
    } catch (error) {
      console.error("Batch processing error:", error);
      throw error;
    }
  },
});

interface MigrationResults {
  totalProcessed: number;
  totalUpdated: number;
  totalErrors: number;
  lastProcessedUserId?: Id<"users">;
}

// Function to run the migration in batches with retry mechanism
export const runCategoryMigration = internalMutation({
  args: {
    maxRetries: v.optional(v.number()),
  },
  returns: v.object({
    totalProcessed: v.number(),
    totalUpdated: v.number(),
    totalErrors: v.number(),
    lastProcessedUserId: v.optional(v.id("users")),
  }),
  handler: async (ctx, args): Promise<MigrationResults> => {
    const maxRetries = args.maxRetries ?? 3;
    const results: MigrationResults = {
      totalProcessed: 0,
      totalUpdated: 0,
      totalErrors: 0,
    };

    let hasMore = true;
    let lastProcessedUserId: Id<"users"> | undefined;
    let retryCount = 0;

    while (hasMore && retryCount < maxRetries) {
      try {
        const batchResult = await ctx.runMutation(internal.migrations.category.migrateCategories, {
          batchSize: 50,
          lastProcessedUserId,
        });

        results.totalProcessed += batchResult.processed;
        results.totalUpdated += batchResult.updated;
        results.totalErrors += batchResult.errors;
        hasMore = batchResult.hasMore;
        lastProcessedUserId = batchResult.lastProcessedUserId;
        results.lastProcessedUserId = lastProcessedUserId;

        // Reset retry count on successful batch
        retryCount = 0;
      } catch (error) {
        console.error(`Batch processing failed (attempt ${retryCount + 1}/${maxRetries}):`, error);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          throw new Error(`Migration failed after ${maxRetries} retries`);
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    return results;
  },
}); 