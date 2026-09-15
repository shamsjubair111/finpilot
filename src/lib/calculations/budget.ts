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
