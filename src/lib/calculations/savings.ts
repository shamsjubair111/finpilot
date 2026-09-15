/**
 * Core savings & cash-flow calculations.
 * Kept pure and framework-agnostic so they can be unit tested and reused
 * once real API data replaces the mock data layer.
 */

export function calculateMonthlySurplus(income: number, expenses: number): number {
  return income - expenses;
}

export function calculateSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  const surplus = calculateMonthlySurplus(income, expenses);
  return Math.max(0, (surplus / income) * 100);
}

/**
 * Available to spend = surplus minus committed savings/goal contributions.
 */
export function calculateAvailableToSpend(
  income: number,
  expenses: number,
  committedContributions: number
): number {
  return Math.max(0, income - expenses - committedContributions);
}

export function calculateEmergencyFundCoverage(
  current: number,
  target: number
): number {
  if (target <= 0) return 100;
  return Math.min(100, Math.round((current / target) * 100));
}

/**
 * Months of essential expenses covered by the emergency fund — a more
 * traditional "runway" measure than simple percent-to-target.
 */
export function calculateEmergencyFundMonths(
  current: number,
  monthlyEssentialExpenses: number
): number {
  if (monthlyEssentialExpenses <= 0) return 0;
  return Math.round((current / monthlyEssentialExpenses) * 10) / 10;
}
