import type { BudgetCategory, BudgetStatus } from "@/types/finance";

export function getBudgetStatus(spent: number, budgeted: number): BudgetStatus {
  if (budgeted <= 0) return "on_track";
  const ratio = spent / budgeted;
  if (ratio > 1) return "over_budget";
  if (ratio >= 0.85) return "near_limit";
  return "on_track";
}

export function getBudgetUtilization(categories: BudgetCategory[]): number {
  const totalBudgeted = categories.reduce((sum, c) => sum + c.budgeted, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  if (totalBudgeted <= 0) return 0;
  return Math.round((totalSpent / totalBudgeted) * 100);
}

export function getBudgetTotals(categories: BudgetCategory[]) {
  const totalBudgeted = categories.reduce((sum, c) => sum + c.budgeted, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  return {
    totalBudgeted,
    totalSpent,
    remaining: totalBudgeted - totalSpent,
    utilization: getBudgetUtilization(categories),
  };
}

/**
 * Effective budgets for the month containing `month`: each budget's spending that month, and for
 * rollover budgets, last month's unspent amount added on top (one month only, never negative).
 */
export function budgetsForMonth<B extends { category: string; budgeted: number; rollover?: boolean }>(
  budgets: B[],
  transactions: { type: string; category: string; amount: number; date: string }[],
  month: Date
) {
  const key = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const current = key(month);
  const spent = new Map<string, number>();
  const prevSpent = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const k = key(new Date(t.date));
    if (k === current) spent.set(t.category, (spent.get(t.category) ?? 0) + t.amount);
    else if (k === current - 1) prevSpent.set(t.category, (prevSpent.get(t.category) ?? 0) + t.amount);
  }
  return budgets.map((b) => {
    const carriedOver = b.rollover ? Math.max(0, b.budgeted - (prevSpent.get(b.category) ?? 0)) : 0;
    return { ...b, baseBudgeted: b.budgeted, carriedOver, budgeted: b.budgeted + carriedOver, spent: spent.get(b.category) ?? 0 };
  });
}
