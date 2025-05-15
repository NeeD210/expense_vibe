import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export const migratePaymentTypesFromUserPreferences = internalMutation({
  args: {},
  handler: async (ctx) => {
    const userPreferences = await ctx.db.query("userPreferences").collect();

    for (const prefs of userPreferences) {
      if (prefs.paymentTypes && prefs.paymentTypes.length > 0) {
        for (const paymentTypeName of prefs.paymentTypes) {
          // Check if this payment type already exists for the user to avoid duplicates
          const existingPaymentType = await ctx.db
            .query("paymentTypes")
            .withIndex("by_user", (q) => q.eq("userId", prefs.userId))
            .filter((q) => q.eq(q.field("name"), paymentTypeName))
            .unique();

          if (!existingPaymentType) {
            await ctx.db.insert("paymentTypes", {
              userId: prefs.userId,
              name: paymentTypeName,
            });
          }
        }
      }
    }
    console.log(`Migrated payment types for ${userPreferences.length} users.`);
    return null; 
  },
}); 

export const migrateExpensePaymentTypeToId = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expenses = await ctx.db.query("expenses").collect();
    let updatedCount = 0;

    for (const expense of expenses) {
      if (expense.userId && expense.paymentType) {
        // Try to find the corresponding paymentType document
        const paymentTypeDoc = await ctx.db
          .query("paymentTypes")
          .withIndex("by_user", (q) => q.eq("userId", expense.userId))
          .filter((q) => q.eq(q.field("name"), expense.paymentType))
          .unique();

        if (paymentTypeDoc) {
          await ctx.db.patch(expense._id, {
            paymentType: paymentTypeDoc._id,
          });
          updatedCount++;
        } else {
          console.warn(
            `Could not find paymentType for expense ${expense._id}: userId=${expense.userId}, paymentType='${expense.paymentType}'`
          );
        }
      }
    }
    console.log(`Updated paymentTypeId for ${updatedCount} expenses.`);
    return null;
  },
}); 

export const removeDeletedAtFromExpenses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expenses = await ctx.db.query("expenses").collect();
    let updatedCount = 0;

    for (const expense of expenses) {
      if (expense.deletedAt !== undefined) {
        await ctx.db.patch(expense._id, { deletedAt: undefined });
        updatedCount++;
      }
    }
    console.log(`Removed deletedAt from ${updatedCount} expenses.`);
    return null;
  },
});

export const removeDeletedAtFromUserPreferences = internalMutation({
  args: {},
  handler: async (ctx) => {
    const preferences = await ctx.db.query("userPreferences").collect();
    let updatedCount = 0;

    for (const preference of preferences) {
      if (preference.deletedAt !== undefined) {
        await ctx.db.patch(preference._id, { deletedAt: undefined });
        updatedCount++;
      }
    }
    console.log(`Removed deletedAt from ${updatedCount} user preferences.`);
    return null;
  },
});

export const removeDeletedAtFromPaymentTypes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const paymentTypes = await ctx.db.query("paymentTypes").collect();
    let updatedCount = 0;

    for (const paymentType of paymentTypes) {
      if (paymentType.deletedAt !== undefined) {
        await ctx.db.patch(paymentType._id, { deletedAt: undefined });
        updatedCount++;
      }
    }
    console.log(`Removed deletedAt from ${updatedCount} payment types.`);
    return null;
  },
});

// Function to run all migrations
export const runAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.migrations.removeDeletedAtFromExpenses);
    await ctx.runMutation(internal.migrations.removeDeletedAtFromUserPreferences);
    await ctx.runMutation(internal.migrations.removeDeletedAtFromPaymentTypes);
    return null;
  },
}); 