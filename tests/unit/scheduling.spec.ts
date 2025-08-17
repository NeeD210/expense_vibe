import { describe, it, expect } from 'vitest';
import { calculateNextDueDateForPaymentType, splitAmountIntoInstallments, stepDateByFrequency } from '../../convex/lib/scheduling';

describe('splitAmountIntoInstallments', () => {
  it('splits evenly without remainder', () => {
    const result = splitAmountIntoInstallments(100, 4);
    expect(result).toEqual([25, 25, 25, 25]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('distributes remainder cents to earliest installments', () => {
    const result = splitAmountIntoInstallments(100, 3); // 10000 cents / 3 = 3333c base, remainder 1
    expect(result).toEqual([33.34, 33.33, 33.33]);
    expect(Math.round(result.reduce((a, b) => a + b, 0) * 100)).toBe(10000);
  });
});

describe('calculateNextDueDateForPaymentType', () => {
  it('returns same date for non-credit types', () => {
    const date = new Date(2024, 0, 15).getTime();
    const result = calculateNextDueDateForPaymentType(date, { isCredit: false });
    expect(result).toBe(date);
  });

  it('calculates next due date across month boundary', () => {
    const date = new Date(2024, 0, 26).getTime(); // Jan 26; closing 25, due 10 -> next closing Feb 25, due in Mar 10 (+1 day => Mar 11)
    const result = calculateNextDueDateForPaymentType(date, { isCredit: true, closingDay: 25, dueDay: 10 });
    const expected = new Date(2024, 2, 11).getTime();
    expect(result).toBe(expected);
  });

  it('calculates due date in same month when dueDay >= closingDay', () => {
    const date = new Date(2024, 0, 20).getTime();
    const result = calculateNextDueDateForPaymentType(date, { isCredit: true, closingDay: 25, dueDay: 28 });
    const expected = new Date(2024, 0, 29).getTime();
    expect(result).toBe(expected);
  });
});


describe('stepDateByFrequency anchoring', () => {
  it('semestrally preserves anchor day across months with DST/UTC safety', () => {
    const start = new Date(2024, 0, 7).getTime(); // Jan 7, 2024
    const anchor = new Date(start).getDate();
    const next1 = stepDateByFrequency(start, 'semestrally', anchor); // +6 months => Jul 7, 2024
    expect(new Date(next1).getFullYear()).toBe(2024);
    expect(new Date(next1).getMonth()).toBe(6);
    expect(new Date(next1).getDate()).toBe(7);

    const next2 = stepDateByFrequency(next1, 'semestrally', anchor); // +6 months => Jan 7, 2025
    expect(new Date(next2).getFullYear()).toBe(2025);
    expect(new Date(next2).getMonth()).toBe(0);
    expect(new Date(next2).getDate()).toBe(7);
  });

  it('monthly clamps to end of month when anchor exceeds days in month', () => {
    const start = new Date(2024, 0, 31).getTime(); // Jan 31, 2024 (leap year following)
    const anchor = new Date(start).getDate();
    const feb = stepDateByFrequency(start, 'monthly', anchor); // Feb -> should clamp to 29 (2024 is leap year)
    expect(new Date(feb).getMonth()).toBe(1);
    expect(new Date(feb).getDate()).toBe(29);

    const mar = stepDateByFrequency(feb, 'monthly', anchor); // Mar -> 31
    expect(new Date(mar).getMonth()).toBe(2);
    expect(new Date(mar).getDate()).toBe(31);
  });
});


