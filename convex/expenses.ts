import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

const defaultPaymentTypes = [
  "Efectivo o Transferencia",
  "Tarjeta 1",
  "Tarjeta 2"
];

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

export const addExpense = mutation({
  args: {
    amount: v.number(),
    categoryId: v.id("categories"),
    cuotas: v.number(),
    date: v.number(),
    description: v.string(),
    paymentTypeId: v.id("paymentTypes"),
    transactionType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Get the category name from the category ID
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");
    
    return await ctx.db.insert("expenses", {
      userId,
      amount: args.amount,
      category: category.name,
      categoryId: args.categoryId,
      cuotas: args.cuotas,
      date: args.date,
      description: args.description,
      paymentTypeId: args.paymentTypeId,
      transactionType: args.transactionType,
      softdelete: false,
    });
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

export const initializeDefaultCategories = mutation({
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
});

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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("paymentTypes", {
      name: args.name,
      userId,
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
    paymentTypes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", q => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { paymentTypes: args.paymentTypes });
    } else {
      await ctx.db.insert("userPreferences", {
        userId,
        paymentTypes: args.paymentTypes,
      });
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
    
    await ctx.db.patch(args.id, { 
      softdelete: true,
      deletedAt: Date.now()
    });
  },
});

export const updateExpense = mutation({
  args: {
    id: v.id("expenses"),
    date: v.number(),
    paymentTypeId: v.id("paymentTypes"),
    categoryId: v.id("categories"),
    description: v.string(),
    amount: v.number(),
    cuotas: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const expense = await ctx.db.get(args.id);
    if (!expense) throw new Error("Expense not found");
    if (expense.userId !== userId) throw new Error("Not authorized");
    
    // Get the category name from the category ID
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");
    
    await ctx.db.patch(args.id, {
      date: args.date,
      paymentTypeId: args.paymentTypeId,
      categoryId: args.categoryId,
      category: category.name,
      description: args.description,
      amount: args.amount,
      cuotas: args.cuotas,
    });
  },
});

export const setDefaultCuotas = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const expenses = await ctx.db.query("expenses").collect();
    let updatedCount = 0;

    for (const expense of expenses) {
      await ctx.db.patch(expense._id, { cuotas: 1 });
      updatedCount++;
    }

    return updatedCount;
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

export const setDefaultTransactionType = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const expenses = await ctx.db.query("expenses").collect();
    let updatedCount = 0;

    for (const expense of expenses) {
      await ctx.db.patch(expense._id, { transactionType: "expense" });
      updatedCount++;
    }

    return updatedCount;
  },
});

export const forceSetTransactionType = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const expenses = await ctx.db.query("expenses").collect();
    let patched = 0;
    for (const expense of expenses) {
      await ctx.db.patch(expense._id, { transactionType: "expense" });
      patched++;
    }
    return patched;
  },
});

export const deleteExpenseById = mutation({
  args: { id: v.id("expenses") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { 
      softdelete: true,
      deletedAt: Date.now()
    });
    return null;
  },
});

export const initializeDefaultPaymentTypes = mutation({
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
});

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
