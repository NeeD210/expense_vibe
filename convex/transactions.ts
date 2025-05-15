import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
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

export const addExpense = mutation({
  args: {
    date: v.number(),
    paymentType: v.string(),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    cuotas: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.db.insert("expenses", {
      userId,
      ...args,
      transactionType: "expense",
    });
  },
});

export const listExpenses = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("expenses")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getCategories = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return defaultCategories;
    
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", q => q.eq("userId", userId))
      .unique();
    
    return prefs?.categories ?? defaultCategories;
  },
});

export const getPaymentTypes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return defaultPaymentTypes;

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", q => q.eq("userId", userId))
      .unique();

    return prefs?.paymentTypes ?? defaultPaymentTypes;
  },
});

export const updateCategories = mutation({
  args: {
    categories: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", q => q.eq("userId", userId))
      .unique();
    
    if (existing) {
      await ctx.db.patch(existing._id, { categories: args.categories });
    } else {
      await ctx.db.insert("userPreferences", {
        userId,
        categories: args.categories,
        paymentTypes: defaultPaymentTypes,
      });
    }
  },
});

export const updatePaymentTypes = mutation({
  args: {
    paymentTypes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
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
        categories: defaultCategories,
      });
    }
  },
});

export const deleteExpense = mutation({
  args: {
    id: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const expense = await ctx.db.get(args.id);
    if (!expense) throw new Error("Expense not found");
    if (expense.userId !== userId) throw new Error("Not authorized");
    
    await ctx.db.delete(args.id);
  },
});

export const updateExpense = mutation({
  args: {
    id: v.id("expenses"),
    date: v.number(),
    paymentType: v.string(),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    cuotas: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const expense = await ctx.db.get(args.id);
    if (!expense) throw new Error("Expense not found");
    if (expense.userId !== userId) throw new Error("Not authorized");
    
    await ctx.db.patch(args.id, {
      date: args.date,
      paymentType: args.paymentType,
      category: args.category,
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

export const getLastExpense = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const lastExpense = await ctx.db
      .query("expenses")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .first();
    
    return lastExpense;
  },
});

export const addTransaction = mutation({
  args: {
    amount: v.number(),
    category: v.string(),
    cuotas: v.number(),
    date: v.number(),
    description: v.string(),
    paymentTypeId: v.id("paymentTypes"),
    transactionType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("expenses", {
      amount: args.amount,
      category: args.category,
      cuotas: args.cuotas,
      date: args.date,
      description: args.description,
      paymentTypeId: args.paymentTypeId,
      transactionType: args.transactionType,
      userId,
    });
  },
});
