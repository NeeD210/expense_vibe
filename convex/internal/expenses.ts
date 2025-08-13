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

    if (!Number.isFinite(totalInstallments) || totalInstallments < 1) {
      throw new Error("totalInstallments must be >= 1");
    }
    if (!Number.isFinite(totalAmount)) {
      throw new Error("totalAmount must be a finite number");
    }

    // Work in integer cents to avoid floating point rounding errors
    const totalAmountCents = Math.round(totalAmount * 100);
    const baseCents = Math.floor(totalAmountCents / totalInstallments);
    let remainderCents = totalAmountCents - baseCents * totalInstallments; // 0..totalInstallments-1

    // Generate payment schedules, distributing remainder cents to the first N installments
    for (let i = 0; i < totalInstallments; i++) {
      const dueDate = new Date(firstDueDate);
      // Preserve day-of-month anchoring when months have fewer days (clamp)
      const targetMonth = dueDate.getMonth() + i;
      const targetYear = dueDate.getFullYear() + Math.floor(targetMonth / 12);
      const monthZero = targetMonth % 12;
      const daysInTarget = new Date(targetYear, monthZero + 1, 0).getDate();
      const day = Math.min(dueDate.getDate(), daysInTarget);
      dueDate.setFullYear(targetYear, monthZero, day);

      const addOneCent = remainderCents > 0 ? 1 : 0;
      const installmentCents = baseCents + addOneCent;
      if (remainderCents > 0) remainderCents -= 1;

      await ctx.db.insert("paymentSchedules", {
        userId,
        expenseId,
        paymentTypeId,
        amount: installmentCents / 100,
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