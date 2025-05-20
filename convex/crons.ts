import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

// Run every day at midnight
const crons = cronJobs();

crons.cron("processRecurringTransactions", "0 0 * * *", internal.internal.recurring.processRecurringTransactions);

export default crons; 