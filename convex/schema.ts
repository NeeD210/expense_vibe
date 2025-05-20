import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    auth0Id: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    isAnonymous: v.optional(v.boolean()),
    lastLoginAt: v.optional(v.number()),
    onboardingCompleted: v.optional(v.boolean()),
    softdelete: v.boolean(),
  }).index("by_auth0Id", ["auth0Id"]),

  categories: defineTable({
    name: v.string(),
    userId: v.id("users"),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    transactionType: v.optional(v.string()),
    softdelete: v.boolean(),
  }).index("by_user", ["userId"]),

  paymentTypes: defineTable({
    name: v.string(),
    userId: v.id("users"),
    deletedAt: v.optional(v.number()),
    softdelete: v.boolean(),
    isCredit: v.optional(v.boolean()),
    closingDay: v.optional(v.number()),
    dueDay: v.optional(v.number()),
  }).index("by_user_softdelete", ["userId", "softdelete"]),

  expenses: defineTable({
    amount: v.number(),
    category: v.string(),
    categoryId: v.optional(v.id("categories")),
    cuotas: v.number(),
    date: v.number(),
    description: v.string(),
    paymentType: v.optional(v.string()),
    paymentTypeId: v.optional(v.id("paymentTypes")),
    transactionType: v.string(),
    userId: v.id("users"),
    deletedAt: v.optional(v.number()),
    softdelete: v.boolean(),
    verified: v.optional(v.boolean()),
    recurringTransactionId: v.optional(v.id("recurringTransactions")),
    nextDueDate: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  recurringTransactions: defineTable({
    userId: v.id("users"),
    description: v.string(),
    amount: v.number(),
    categoryId: v.id("categories"),
    paymentTypeId: v.id("paymentTypes"),
    transactionType: v.string(),
    frequency: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    lastProcessedDate: v.optional(v.number()),
    nextDueDateCalculationDay: v.optional(v.number()),
    isActive: v.boolean(),
    softdelete: v.boolean(),
    cuotas: v.number(),
  })
  .index("by_user_isActive_startDate", ["userId", "isActive", "startDate"])
  .index("by_isActive_lastProcessedDate", ["isActive", "lastProcessedDate"]),

  paymentSchedules: defineTable({
    userId: v.id("users"),
    expenseId: v.id("expenses"),
    paymentTypeId: v.id("paymentTypes"),
    amount: v.number(),
    dueDate: v.number(),
    installmentNumber: v.number(),
    totalInstallments: v.number(),
    softdelete: v.boolean(),
  })
  .index("by_expenseId", ["expenseId"])
  .index("by_user_dueDate", ["userId", "dueDate"]),
});