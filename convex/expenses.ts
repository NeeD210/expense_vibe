import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const defaultCategories = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other"
];

const defaultPaymentTypes = [
  "Credit Card",
  "Cash",
  "Debit Card",
  "Bank Transfer"
];

export const addExpense = mutation({
  args: {
    date: v.number(),
    paymentType: v.string(),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.db.insert("expenses", {
      userId,
      ...args,
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
        categories: defaultCategories,
        paymentTypes: args.paymentTypes,
      });
    }
  },
});
