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
    softdelete: v.optional(v.boolean()),
  }).index("by_user", ["userId"])
    .index("by_user_softdelete", ["userId", "softdelete"]),

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
    deletedAt: v.optional(v.float64()),
    softdelete: v.optional(v.boolean()),
    verified: v.optional(v.boolean()),
    recurringTransactionId: v.optional(v.id("recurringTransactions")),
    nextDueDate: v.optional(v.float64()),
  }).index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_user_softdelete", ["userId", "softdelete"])
    .index("by_recurringTransactionId", ["recurringTransactionId"])
    .index("by_categoryId", ["categoryId"]),

  recurringTransactions: defineTable({
    userId: v.id("users"),
    description: v.string(),
    amount: v.float64(),
    categoryId: v.id("categories"),
    paymentTypeId: v.optional(v.id("paymentTypes")),
    transactionType: v.string(),
    frequency: v.string(),
    startDate: v.float64(),
    endDate: v.optional(v.float64()),
    lastProcessedDate: v.optional(v.float64()),
    nextDueDateCalculationDay: v.optional(v.float64()),
    isActive: v.boolean(),
    softdelete: v.optional(v.boolean()),
    cuotas: v.optional(v.float64()),
  })
  .index("by_user_isActive_startDate", ["userId", "isActive", "startDate"])
  .index("by_isActive_lastProcessedDate", ["isActive", "lastProcessedDate"])
  .index("by_user_softdelete", ["userId", "softdelete"])
  .index("by_user_isActive_softdelete", ["userId", "isActive", "softdelete"])
  .index("by_user_isActive_startDate_softdelete", ["userId", "isActive", "startDate", "softdelete"]),

  paymentSchedules: defineTable({
    userId: v.id("users"),
    expenseId: v.id("expenses"),
    paymentTypeId: v.id("paymentTypes"),
    amount: v.float64(),
    dueDate: v.float64(),
    installmentNumber: v.float64(),
    totalInstallments: v.float64(),
    softdelete: v.optional(v.boolean()),
  })
  .index("by_user_dueDate", ["userId", "dueDate"])
  .index("by_expenseId", ["expenseId"])
  .index("by_user_dueDate_softdelete", ["userId", "dueDate", "softdelete"])
  .index("by_user_softdelete_dueDate", ["userId", "softdelete", "dueDate"]),
});