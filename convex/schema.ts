import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  authAccounts: defineTable({
    provider: v.string(),
    providerAccountId: v.string(),
    secret: v.string(),
    userId: v.id("users"),
    softdelete: v.optional(v.boolean()),
  }).index("providerAndAccountId", ["provider", "providerAccountId"]),
  authRateLimits: defineTable({
    attemptsLeft: v.float64(),
    identifier: v.id("authAccounts"),
    lastAttemptTime: v.float64(),
    softdelete: v.optional(v.boolean()),
  }),
  authRefreshTokens: defineTable({
    expirationTime: v.float64(),
    firstUsedTime: v.optional(v.float64()),
    parentRefreshTokenId: v.optional(
      v.id("authRefreshTokens")
    ),
    sessionId: v.id("authSessions"),
    softdelete: v.optional(v.boolean()),
  }),
  authSessions: defineTable({
    expirationTime: v.float64(),
    userId: v.id("users"),
    softdelete: v.optional(v.boolean()),
  }),
  expenses: defineTable({
    amount: v.float64(),
    category: v.string(),
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
  }).index("by_user", ["userId"]),
  userPreferences: defineTable({
    categories: v.array(v.string()),
    paymentTypes: v.array(v.string()),
    userId: v.id("users"),
    deletedAt: v.optional(v.number()),
    softdelete: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),
  users: defineTable({
    email: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    softdelete: v.optional(v.boolean()),
  }),
});