import type { FinancialGoal } from "@/types/finance";

export function calculateGoalProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function calculateGoalRemaining(current: number, target: number): number {
  return Math.max(0, target - current);
}

/**
 * Months needed to reach a goal given a fixed monthly contribution.
 * Returns Infinity if the contribution can never close the gap.
 */
export function calculateMonthsToGoal(
  current: number,
  target: number,
  monthlyContribution: number
): number {
  const remaining = calculateGoalRemaining(current, target);
  if (remaining <= 0) return 0;
  if (monthlyContribution <= 0) return Infinity;
  return Math.ceil(remaining / monthlyContribution);
}

export function estimateCompletionDate(
  monthsFromNow: number,
  from: Date = new Date()
): Date {
  const date = new Date(from);
  date.setMonth(date.getMonth() + monthsFromNow);
  return date;
}

export function getGoalStatus(
  goal: FinancialGoal
): "on_track" | "behind" | "completed" {
  const progress = calculateGoalProgress(goal.currentAmount, goal.goalAmount);
  if (progress >= 100) return "completed";

  const monthsToGoal = calculateMonthsToGoal(
    goal.currentAmount,
    goal.goalAmount,
    goal.monthlyContribution
  );
  const targetDate = new Date(goal.targetDate);
  const monthsUntilTarget = Math.max(
    0,
    (targetDate.getFullYear() - new Date().getFullYear()) * 12 +
      (targetDate.getMonth() - new Date().getMonth())
  );

  return monthsToGoal <= monthsUntilTarget ? "on_track" : "behind";
}
