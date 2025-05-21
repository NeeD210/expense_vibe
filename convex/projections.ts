import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

// Common interface for projection items
interface ProjectionItem {
  date: number;
  amount: number;
  description: string;
  type: "installment" | "recurring";
  originalExpenseId?: Id<"expenses">;
  recurringTransactionId?: Id<"recurringTransactions">;
  categoryId: Id<"categories"> | Id<"paymentTypes">;
  paymentTypeId?: Id<"paymentTypes">;
  transactionType?: string;
}

export const getProjectedPayments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Calculate the start of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const dateRangeStart = startOfMonth.getTime();
    // Calculate the end of the 12th month (start of month + 12 months - 1 ms)
    const endOf12thMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 12, 0, 23, 59, 59, 999);
    const dateRangeEnd = endOf12thMonth.getTime();

    console.log("[Projections] Input:", { 
      userId, 
      dateRangeStart: new Date(dateRangeStart).toISOString(), 
      dateRangeEnd: new Date(dateRangeEnd).toISOString() 
    });

    // First get all payment schedules for this user to debug
    const allPaymentSchedules = await ctx.db
      .query("paymentSchedules")
      // We need to query using the existing index and then filter client-side
      .withIndex("by_user_dueDate", (q) => q.eq("userId", userId))
      .collect();
    
    console.log(`[Projections] All payment schedules for user: ${allPaymentSchedules.length}`);
    
    // Log a few example schedules to understand their structure
    if (allPaymentSchedules.length > 0) {
      console.log("[Projections] Example payment schedule:", {
        firstSchedule: allPaymentSchedules[0],
        dateFields: {
          dueDate: allPaymentSchedules[0].dueDate ? new Date(allPaymentSchedules[0].dueDate).toISOString() : 'none'
        }
      });
    }

    // 1. Get scheduled installments with proper filtering
    const paymentSchedules = await ctx.db
      .query("paymentSchedules")
      .withIndex("by_user_dueDate", (q) =>
        q.eq("userId", userId).gte("dueDate", dateRangeStart).lte("dueDate", dateRangeEnd)
      )
      .filter((q) => q.eq(q.field("softdelete"), false))
      .collect();
    
    console.log(`[Projections] Filtered payment schedules: ${paymentSchedules.length}`);
    
    // Debug why some schedules might be filtered out
    for (const schedule of allPaymentSchedules) {
      if (!paymentSchedules.some(ps => ps._id === schedule._id)) {
        const dueDate = schedule.dueDate || 0;
        const reasons = [];
        
        if (schedule.softdelete) reasons.push('softdeleted');
        if (!schedule.dueDate) reasons.push('no dueDate');
        if (dueDate < dateRangeStart) reasons.push('before dateRangeStart');
        if (dueDate > dateRangeEnd) reasons.push('after dateRangeEnd');
        
        console.log(`[Projections] Schedule ${schedule._id} filtered out:`, 
          reasons.join(', '), 
          schedule.dueDate ? new Date(schedule.dueDate).toISOString() : 'no date'
        );
      }
    }

    // Get the corresponding expenses for these schedules
    const expenseIds = [...new Set(paymentSchedules.map((ps) => ps.expenseId))];
    const expenses = await Promise.all(
      expenseIds.map((id) => ctx.db.get(id))
    );
    console.log(`[Projections] Related expenses count: ${expenses.length}`);

    // Map payment schedules to projection items
    const installmentItems: ProjectionItem[] = paymentSchedules.map((schedule) => {
      const expense = expenses.find((e) => e?._id === schedule.expenseId);
      return {
        date: schedule.dueDate,
        amount: schedule.amount,
        description: expense?.description ?? "Unknown Expense",
        type: "installment",
        originalExpenseId: schedule.expenseId,
        categoryId: expense?.categoryId ?? schedule.paymentTypeId, // Fallback to paymentTypeId if categoryId is not available
        paymentTypeId: schedule.paymentTypeId,
        transactionType: expense?.transactionType,
      };
    });
    console.log(`[Projections] installmentItems count: ${installmentItems.length}`);

    // Get all recurring transactions for this user
    const recurringTransactions = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_user_isActive_startDate", (q) =>
        q.eq("userId", userId).eq("isActive", true)
      )
      .filter((q) => 
        q.eq(q.field("softdelete"), false) &&
        q.lte(q.field("startDate"), dateRangeEnd)
      )
      .collect();
    console.log(`[Projections] recurringTransactions count: ${recurringTransactions.length}`);

    // Simulate future occurrences for each recurring transaction
    const recurringItems: ProjectionItem[] = [];
    for (const rt of recurringTransactions) {
      console.log(`[Projections] Processing recurring transaction: ${rt._id}`, {
        startDate: new Date(rt.startDate).toISOString(),
        dateRangeStart: new Date(dateRangeStart).toISOString(),
        dateRangeEnd: new Date(dateRangeEnd).toISOString(),
        lastProcessed: rt.lastProcessedDate ? new Date(rt.lastProcessedDate).toISOString() : 'none'
      });
      
      // Initialize the current date based on the start date of the recurring transaction
      let currentDate = rt.startDate;
      
      // If last processed date exists and is after the start date, use it as the reference point
      if (rt.lastProcessedDate && rt.lastProcessedDate > currentDate) {
        currentDate = getNextDate(rt.lastProcessedDate, rt.frequency);
      }
      
      let simulatedCount = 0;
      const endDate = rt.endDate ?? dateRangeEnd;
      
      while (currentDate <= endDate && currentDate <= dateRangeEnd) {
        // If current date is within our date range, add it
        if (currentDate >= dateRangeStart) {
          recurringItems.push({
            date: currentDate,
            amount: rt.amount,
            description: rt.description,
            type: "recurring",
            recurringTransactionId: rt._id,
            categoryId: rt.categoryId,
            paymentTypeId: rt.paymentTypeId,
            transactionType: rt.transactionType,
          });
          simulatedCount++;
        }
        
        // Move to next occurrence
        currentDate = getNextDate(currentDate, rt.frequency);
      }
      console.log(`[Projections] Generated ${simulatedCount} occurrences for transaction ${rt._id}`);
    }
    console.log(`[Projections] Total recurringItems: ${recurringItems.length}`);

    // 3. Combine and sort all items
    const allItems = [...installmentItems, ...recurringItems].sort((a, b) => a.date - b.date);
    console.log(`[Projections] Final allItems count: ${allItems.length}`);

    return allItems;
  },
});

// Helper function to calculate the next date based on frequency
function getNextDate(currentDate: number, frequency: string): number {
  const date = new Date(currentDate);
  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
  }
  return date.getTime();
} 