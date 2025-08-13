import { describe, it, expect } from 'vitest';
import { calculateNextDueDateForPaymentType, splitAmountIntoInstallments } from '../../convex/lib/scheduling';

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


