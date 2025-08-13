import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { addMonths, setDate } from "date-fns";
import { internal } from "./_generated/api";
import { calculateNextDueDateForPaymentType } from "./lib/scheduling";

const defaultCategories = [
  "Vivienda",
  "Servicios",
  "Transporte",
  "Alimentación",
  "Seguros y Salud",
  "Deudas",
  "Ropa",
  "Hogar y electrónica",
  "Ocio",
  "Mascotas",
  "Educación",
  "Otras"
];

// default payment types are handled in auth.createUser

// Helper function to get the authenticated user's ID
async function getAuthenticatedUserId(ctx: { auth: { getUserIdentity: () => Promise<any> }, db: any }): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("auth0Id"), identity.subject))
    .first();

  return user?._id ?? null;
}

// Internal helper to generate payment schedules
// Removed local schedule generator; use internal/internal version as the single source of truth

// Helper to calculate next due date based on payment type
async function calculateNextDueDate(ctx: any, date: number, paymentTypeId: Id<"paymentTypes">): Promise<number> {
  const paymentType = await ctx.db.get(paymentTypeId);
  if (!paymentType) throw new Error("Payment type not found");
  return calculateNextDueDateForPaymentType(date, paymentType);
}

export const addExpense = mutation({
  args: {
    amount: v.number(),
    categoryId: v.id("categories"),
    cuotas: v.number(),
    date: v.number(),
    description: v.string(),
    paymentTypeId: v.optional(v.id("paymentTypes")),
    transactionType: v.string(),
    recurringTransactionId: v.optional(v.id("recurringTransactions")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!Number.isFinite(args.cuotas) || args.cuotas < 1) {
      throw new Error("cuotas must be >= 1");
    }
    if (!Number.isFinite(args.amount)) {
      throw new Error("amount must be a finite number");
    }
    
    // Get the category name from the category ID
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");

    // Calculate next due date if payment type is provided
    let nextDueDate: number | undefined;
    if (args.paymentTypeId) {
      nextDueDate = await calculateNextDueDate(ctx, args.date, args.paymentTypeId);
    }
    
    // Set verified status based on whether this is from a recurring transaction
    const verified = args.recurringTransactionId ? false : true;
    
    const expenseId = await ctx.db.insert("expenses", {
      userId,
      amount: args.amount,
      category: category.name,
      categoryId: args.categoryId,
      cuotas: args.cuotas,
      date: args.date,
      description: args.description,
      paymentTypeId: args.paymentTypeId,
      transactionType: args.transactionType,
      nextDueDate,
      verified,
      recurringTransactionId: args.recurringTransactionId,
      softdelete: false,
    });

    // Generate payment schedules if payment type is provided
    if (args.paymentTypeId) {
      await ctx.runMutation(internal.internal.expenses.generatePaymentSchedules, {
        expenseId,
        firstDueDate: nextDueDate!,
        totalAmount: args.amount,
        totalInstallments: args.cuotas,
        userId,
        paymentTypeId: args.paymentTypeId,
      });
    }

    return expenseId;
  },
});

export const listAllTransactions = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("expenses")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("softdelete"), false))
      .order("desc")
      .collect();
  },
});

export const listExpenses = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("expenses")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.and(
        q.eq(q.field("transactionType"), "expense"),
        q.eq(q.field("softdelete"), false)
      ))
      .order("desc")
      .collect();
  },
});

export const listIncome = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("expenses")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.and(
        q.eq(q.field("transactionType"), "income"),
        q.eq(q.field("softdelete"), false)
      ))
      .order("desc")
      .collect();
  },
});

export const getCategories = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) return defaultCategories;
    
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("softdelete"), false))
      .collect();
    
    if (categories.length > 0) {
      return categories.map(c => c.name);
    }
    
    return defaultCategories;
  },
});

// initialize defaults moved to auth.createUser; keep function removed to prevent duplication
/* export const initializeDefaultCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.warn(
        `initializeDefaultCategories: Skipping due to no auth identity. This might be normal if called during initial user setup when auth.ts:createUser is primary.`,
      );
      return;
    }

    // Get the user record using the auth identity
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("auth0Id"), identity.subject))
      .first();

    if (!user) {
      console.warn(
        `initializeDefaultCategories: Skipping due to no user record found. This might be normal if called during initial user setup when auth.ts:createUser is primary.`,
      );
      return;
    }

    // Check if user already has categories
    const existingCategories = await ctx.db
      .query("categories")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .filter(q => q.eq(q.field("softdelete"), false))
      .collect();

    if (existingCategories.length === 0) {
      // Create default categories
      for (const name of defaultCategories) {
        await ctx.db.insert("categories", {
          name,
          userId: user._id,
          softdelete: false,
        });
      }
    }
  },
}); */

export const getPaymentTypes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Get the user record using the auth identity
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("auth0Id"), identity.subject))
      .first();

    if (!user) return [];

    const paymentTypes = await ctx.db
      .query("paymentTypes")
      .withIndex("by_user_softdelete", q => q.eq("userId", user._id).eq("softdelete", false))
      .collect();

    return paymentTypes;
  },
});

export const addPaymentType = mutation({
  args: {
    name: v.string(),
    isCredit: v.optional(v.boolean()),
    closingDay: v.optional(v.number()),
    dueDay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate credit card fields if isCredit is true
    if (args.isCredit) {
      if (!args.closingDay || !args.dueDay) {
        throw new Error("Closing day and due day are required for credit cards");
      }
      if (args.closingDay < 1 || args.closingDay > 31 || args.dueDay < 1 || args.dueDay > 31) {
        throw new Error("Closing day and due day must be between 1 and 31");
      }
    }

    return await ctx.db.insert("paymentTypes", {
      name: args.name,
      userId,
      isCredit: args.isCredit ?? false,
      closingDay: args.closingDay,
      dueDay: args.dueDay,
      softdelete: false,
    });
  },
});

export const removePaymentType = mutation({
  args: {
    id: v.id("paymentTypes"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const paymentType = await ctx.db.get(args.id);
    if (!paymentType || paymentType.userId !== userId) {
      throw new Error("Payment type not found");
    }

    await ctx.db.patch(args.id, { softdelete: true });
  },
});

export const updateCategories = mutation({
  args: {
    categories: v.array(v.object({
      name: v.string(),
      transactionType: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Get existing categories
    const existingCategories = await ctx.db
      .query("categories")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
    
    // Soft delete categories that are no longer in the list
    for (const category of existingCategories) {
      if (!args.categories.some(c => c.name === category.name && c.transactionType === category.transactionType)) {
        await ctx.db.patch(category._id, { softdelete: true });
      }
    }
    
    // Create new categories
    for (const category of args.categories) {
      const exists = existingCategories.some(c => 
        c.name === category.name && 
        c.transactionType === category.transactionType
      );
      if (!exists) {
        await ctx.db.insert("categories", {
          name: category.name,
          userId,
          transactionType: category.transactionType,
          softdelete: false,
        });
      }
    }
  },
});

export const updatePaymentTypes = mutation({
  args: {
    paymentTypes: v.array(v.object({
      name: v.string(),
      isCredit: v.optional(v.boolean()),
      closingDay: v.optional(v.number()),
      dueDay: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get existing payment types
    const existingTypes = await ctx.db
      .query("paymentTypes")
      .withIndex("by_user_softdelete", q => q.eq("userId", userId).eq("softdelete", false))
      .collect();

    // Soft delete types that are no longer in the list
    for (const type of existingTypes) {
      if (!args.paymentTypes.some(t => t.name === type.name)) {
        await ctx.db.patch(type._id, { 
          softdelete: true,
          deletedAt: Date.now()
        });
      }
    }

    // Create or update payment types
    for (const type of args.paymentTypes) {
      // Validate credit card fields if isCredit is true
      if (type.isCredit) {
        if (!type.closingDay || !type.dueDay) {
          throw new Error("Closing day and due day are required for credit cards");
        }
        if (type.closingDay < 1 || type.closingDay > 31 || type.dueDay < 1 || type.dueDay > 31) {
          throw new Error("Closing day and due day must be between 1 and 31");
        }
      }

      const existingType = existingTypes.find(t => t.name === type.name);
      if (existingType) {
        // Update existing type
        await ctx.db.patch(existingType._id, {
          isCredit: type.isCredit ?? false,
          closingDay: type.closingDay,
          dueDay: type.dueDay,
        });
      } else {
        // Create new type
        await ctx.db.insert("paymentTypes", {
          name: type.name,
          userId,
          isCredit: type.isCredit ?? false,
          closingDay: type.closingDay,
          dueDay: type.dueDay,
          softdelete: false,
        });
      }
    }
  },
});

export const deleteExpense = mutation({
  args: {
    id: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const expense = await ctx.db.get(args.id);
    if (!expense) throw new Error("Expense not found");
    if (expense.userId !== userId) throw new Error("Not authorized");
    
    // Delete associated payment schedules
    await ctx.runMutation(internal.internal.expenses.deletePaymentSchedulesForExpense, {
      expenseId: args.id,
    });
    
    // Soft delete the expense
    await ctx.db.patch(args.id, { 
      softdelete: true,
      deletedAt: Date.now()
    });
  },
});

export const updateExpense = mutation({
  args: {
    id: v.id("expenses"),
    amount: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    cuotas: v.optional(v.number()),
    date: v.optional(v.number()),
    description: v.optional(v.string()),
    paymentTypeId: v.optional(v.id("paymentTypes")),
    transactionType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const expense = await ctx.db.get(args.id);
    if (!expense || expense.userId !== userId) {
      throw new Error("Expense not found");
    }

    const updates: any = {
      verified: true // Mark as verified when modified by the user
    };

    if (args.cuotas !== undefined && (!Number.isFinite(args.cuotas) || args.cuotas < 1)) {
      throw new Error("cuotas must be >= 1");
    }
    if (args.amount !== undefined && !Number.isFinite(args.amount)) {
      throw new Error("amount must be a finite number");
    }

    // Update category name if categoryId is provided
    if (args.categoryId) {
      const category = await ctx.db.get(args.categoryId);
      if (!category) throw new Error("Category not found");
      updates.category = category.name;
      updates.categoryId = args.categoryId;
    }

    // Add all other updates
    for (const [key, value] of Object.entries(args)) {
      if (key !== "id" && key !== "categoryId" && value !== undefined) {
        updates[key] = value;
      }
    }

    // Check if we need to recalculate schedules
    const needsScheduleRecalculation = 
      args.date !== undefined || 
      args.paymentTypeId !== undefined || 
      args.cuotas !== undefined || 
      args.amount !== undefined;

    // Recalculate nextDueDate if date or paymentTypeId changed
    if (args.date !== undefined || args.paymentTypeId !== undefined) {
      const date = args.date ?? expense.date;
      const paymentTypeId = args.paymentTypeId ?? expense.paymentTypeId;
      
      if (paymentTypeId) {
        updates.nextDueDate = await calculateNextDueDate(ctx, date, paymentTypeId);
      }
    }

    // Update the expense
    await ctx.db.patch(args.id, updates);

    // Regenerate payment schedules if needed
    if (needsScheduleRecalculation && expense.paymentTypeId) {
      // Delete existing schedules
      await ctx.runMutation(internal.internal.expenses.deletePaymentSchedulesForExpense, {
        expenseId: args.id,
      });

      // Get the updated expense
      const updatedExpense = await ctx.db.get(args.id);
      if (!updatedExpense) throw new Error("Updated expense not found");

      // Create new schedules
      await ctx.runMutation(internal.internal.expenses.generatePaymentSchedules, {
        expenseId: args.id,
        firstDueDate: updatedExpense.nextDueDate!,
        totalAmount: updatedExpense.amount,
        totalInstallments: updatedExpense.cuotas,
        userId,
        paymentTypeId: updatedExpense.paymentTypeId!,
      });
    }

    return args.id;
  },
});

// Verify an expense (mark it as verified without making other changes)
export const verifyExpense = mutation({
  args: {
    id: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const expense = await ctx.db.get(args.id);
    if (!expense || expense.userId !== userId) {
      throw new Error("Expense not found");
    }

    // Only set the verified flag to true
    await ctx.db.patch(args.id, { verified: true });
    
    return args.id;
  },
});

export const getLastTransaction = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) return null;
    
    const lastExpense = await ctx.db
      .query("expenses")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("softdelete"), false))
      .order("desc")
      .first();
    
    return lastExpense;
  },
});

/* export const initializeDefaultPaymentTypes = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.warn(
        `initializeDefaultPaymentTypes: Skipping due to no auth identity. This might be normal if called during initial user setup when auth.ts:createUser is primary.`,
      );
      return;
    }

    // Get the user record using the auth identity
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("auth0Id"), identity.subject))
      .first();

    if (!user) {
      console.warn(
        `initializeDefaultPaymentTypes: Skipping due to no user record found. This might be normal if called during initial user setup when auth.ts:createUser is primary.`,
      );
      return;
    }

    // Check if user already has payment types
    const existingTypes = await ctx.db
      .query("paymentTypes")
      .withIndex("by_user_softdelete", q => q.eq("userId", user._id).eq("softdelete", false))
      .collect();

    if (existingTypes.length === 0) {
      // Create default payment types
      for (const name of defaultPaymentTypes) {
        await ctx.db.insert("paymentTypes", {
          name,
          userId: user._id,
          softdelete: false,
        });
      }
    }
  },
}); */

export const getCategoriesWithIds = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) return [];
    
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("softdelete"), false))
      .collect();
    
    return categories;
  },
});

export const getCategoriesWithIdsIncludingDeleted = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) return [];
    
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
    
    return categories;
  },
});

export const getHistoricPaymentTypes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Get the user record using the auth identity
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("auth0Id"), identity.subject))
      .first();

    if (!user) return [];

    const paymentTypes = await ctx.db
      .query("paymentTypes")
      .withIndex("by_user_softdelete", q => q.eq("userId", user._id))
      .collect();

    return paymentTypes;
  },
});

export const migratePaymentSchedules = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all expenses that are not softdeleted and have a paymentTypeId
    const expenses = await ctx.db
      .query("expenses")
      .filter(q => q.and(
        q.neq(q.field("softdelete"), true),
        q.neq(q.field("paymentTypeId"), undefined)
      ))
      .collect();

    let migratedCount = 0;
    for (const expense of expenses) {
      // Check if there are already payment schedules for this expense
      const existingSchedules = await ctx.db
        .query("paymentSchedules")
        .withIndex("by_expenseId", q => q.eq("expenseId", expense._id))
        .filter(q => q.eq(q.field("softdelete"), false))
        .collect();
      if (existingSchedules.length > 0) continue; // Already migrated

      // Skip if paymentTypeId is undefined
      if (!expense.paymentTypeId) continue;

      // Calculate nextDueDate if not present
      let nextDueDate = expense.nextDueDate;
      if (!nextDueDate) {
        nextDueDate = await calculateNextDueDate(ctx, expense.date, expense.paymentTypeId);
      }
      if (!nextDueDate) continue; // Can't migrate without due date

      // Use internal mutation to generate payment schedules
      await ctx.runMutation(internal.internal.expenses.generatePaymentSchedules, {
        expenseId: expense._id,
        firstDueDate: nextDueDate,
        totalAmount: expense.amount,
        totalInstallments: expense.cuotas,
        userId: expense.userId,
        paymentTypeId: expense.paymentTypeId,
      });
      migratedCount++;
    }
    return { migratedCount };
  },
});
