import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  expenses: defineTable({
    userId: v.id("users"),
    date: v.number(),
    paymentType: v.string(),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    cuotas: v.optional(v.number()),
    transactionType: v.string(),
  }).index("by_user", ["userId"]),
  
  userPreferences: defineTable({
    userId: v.id("users"),
    categories: v.array(v.string()),
    paymentTypes: v.array(v.string()),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
