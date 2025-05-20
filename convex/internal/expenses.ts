import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { addMonths } from "date-fns";
import { Id } from "../_generated/dataModel";

// Internal helper to generate payment schedules
export const generatePaymentSchedules = internalMutation({
  args: {
    paymentTypeId: v.id("paymentTypes"),
    userId: v.id("users"),
    expenseId: v.id("expenses"),
    totalInstallments: v.number(),
    firstDueDate: v.number(),
    totalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const { paymentTypeId, userId, expenseId, totalInstallments, firstDueDate, totalAmount } = args;
    
    // Calculate the amount per installment
    const amountPerInstallment = totalAmount / totalInstallments;
    
    // Generate payment schedules
    for (let i = 0; i < totalInstallments; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      await ctx.db.insert("paymentSchedules", {
        userId,
        expenseId,
        paymentTypeId,
        amount: amountPerInstallment,
        dueDate: dueDate.getTime(),
        installmentNumber: i + 1,
        totalInstallments,
        softdelete: false,
      });
    }
  },
});

// Internal helper to delete payment schedules for an expense
export const deletePaymentSchedulesForExpense = internalMutation({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const { expenseId } = args;

    // Find all payment schedules for this expense
    const schedules = await ctx.db
      .query("paymentSchedules")
      .withIndex("by_expenseId", q => q.eq("expenseId", expenseId))
      .collect();

    // Soft delete each schedule
    for (const schedule of schedules) {
      await ctx.db.patch(schedule._id, { softdelete: true });
    }
  },
}); 