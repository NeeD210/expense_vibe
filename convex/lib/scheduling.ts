import { Id } from "../_generated/dataModel";

export interface PaymentTypeLike {
  isCredit: boolean;
  closingDay?: number;
  dueDay?: number;
}

// Calculate the next due date for a given transaction date and payment type.
// Mirrors logic in server code; kept pure for unit testing.
export function calculateNextDueDateForPaymentType(date: number, paymentType: PaymentTypeLike): number {
  if (!paymentType.isCredit || !paymentType.closingDay || !paymentType.dueDay) {
    return date;
  }

  const transactionDate = new Date(date);
  const closingDay = paymentType.closingDay;
  const dueDay = paymentType.dueDay;

  let effectiveClosingDate: Date;
  const transactionMonth = transactionDate.getMonth();
  const transactionYear = transactionDate.getFullYear();

  const currentMonthClosingDate = new Date(transactionYear, transactionMonth, closingDay);

  if (transactionDate <= currentMonthClosingDate) {
    effectiveClosingDate = currentMonthClosingDate;
  } else {
    let nextMonth = transactionMonth + 1;
    let nextYear = transactionYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    effectiveClosingDate = new Date(nextYear, nextMonth, closingDay);
  }

  let dueMonth = effectiveClosingDate.getMonth();
  let dueYear = effectiveClosingDate.getFullYear();

  if (dueDay < closingDay) {
    dueMonth += 1;
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
  }

  const nextDueDate = new Date(dueYear, dueMonth, dueDay);
  nextDueDate.setDate(nextDueDate.getDate() + 1);
  return nextDueDate.getTime();
}

// Split a total amount into N installments with cent-accurate distribution.
// Returns an array of amounts in the same currency units as input (e.g., dollars), summing to totalAmount.
export function splitAmountIntoInstallments(totalAmount: number, totalInstallments: number): number[] {
  if (!Number.isFinite(totalInstallments) || totalInstallments < 1) {
    throw new Error("totalInstallments must be >= 1");
  }
  if (!Number.isFinite(totalAmount)) {
    throw new Error("totalAmount must be a finite number");
  }

  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / totalInstallments);
  let remainder = totalCents - baseCents * totalInstallments;

  const result: number[] = [];
  for (let i = 0; i < totalInstallments; i++) {
    const add = remainder > 0 ? 1 : 0;
    result.push((baseCents + add) / 100);
    if (remainder > 0) remainder -= 1;
  }
  return result;
}


// Frequency stepping helpers
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "semestrally" | "yearly";

function clampDayOfMonth(year: number, monthZeroBased: number, desiredDay: number): Date {
  // JS Date will overflow days; clamp by creating date at 1 and then setting date min(desired, daysInMonth)
  const daysInMonth = new Date(year, monthZeroBased + 1, 0).getDate();
  const day = Math.min(desiredDay, daysInMonth);
  // Normalize to local noon to avoid timezone/DST shifting across date boundaries
  return new Date(year, monthZeroBased, day, 12, 0, 0, 0);
}

export function stepDateByFrequency(current: number, frequency: RecurringFrequency, anchorDay?: number): number {
  const date = new Date(current);
  // Normalize to local noon first, so day/week arithmetic preserves the calendar date across timezones/DST
  date.setHours(12, 0, 0, 0);
  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      return date.getTime();
    case "weekly":
      date.setDate(date.getDate() + 7);
      return date.getTime();
    case "monthly": {
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // next month
      const anchor = anchorDay ?? date.getDate();
      return clampDayOfMonth(year, month, anchor).getTime();
    }
    case "semestrally": {
      const year = date.getFullYear();
      const month = date.getMonth() + 6; // +6 months
      const anchor = anchorDay ?? date.getDate();
      return clampDayOfMonth(year, month, anchor).getTime();
    }
    case "yearly": {
      const year = date.getFullYear() + 1;
      const month = date.getMonth();
      const anchor = anchorDay ?? date.getDate();
      return clampDayOfMonth(year, month, anchor).getTime();
    }
    default:
      return date.getTime();
  }
}

export function initializeNextDueDate(startDate: number, now: number, frequency: RecurringFrequency): number {
  // First occurrence >= now, starting at startDate
  // Normalize candidate to local noon to ensure consistent behavior across timezones
  const initial = new Date(startDate);
  initial.setHours(12, 0, 0, 0);
  let candidate = initial.getTime();
  const anchor = new Date(startDate).getDate();
  while (candidate < now) {
    candidate = stepDateByFrequency(candidate, frequency, anchor);
  }
  return candidate;
}


