import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  expenses: defineTable({
    amount: v.float64(),
    category: v.string(),
    categoryId: v.optional(v.id("categories")),
    cuotas: v.float64(),
    date: v.float64(),
    description: v.string(),
    paymentType: v.optional(v.string()),
    paymentTypeId: v.optional(v.id("paymentTypes")),
    transactionType: v.string(),
    userId: v.id("users"),
    deletedAt: v.optional(v.number()),
    softdelete: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),
  paymentTypes: defineTable({
    name: v.string(),
    userId: v.id("users"),
    deletedAt: v.optional(v.number()),
    softdelete: v.optional(v.boolean()),
  }).index("by_user_softdelete", ["userId", "softdelete"]),
  userPreferences: defineTable({
    categories: v.optional(v.array(v.string())),
    paymentTypes: v.array(v.string()),
    userId: v.id("users"),
    deletedAt: v.optional(v.number()),
    softdelete: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),
  users: defineTable({
    auth0Id: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    isAnonymous: v.optional(v.boolean()),
    lastLoginAt: v.optional(v.float64()),
    onboardingCompleted: v.optional(v.boolean()),
    softdelete: v.optional(v.boolean()),
  }).index("by_auth0Id", ["auth0Id"]),
  categories: defineTable({
    name: v.string(),
    userId: v.id("users"),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    softdelete: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),
});