import type { BudgetCategory, FinancialGoal, UserProfile } from "@/types/finance";
import { calculateAvailableToSpend, calculateEmergencyFundCoverage } from "@/lib/calculations/savings";
import { getBudgetTotals } from "@/lib/calculations/budget";

/**
 * Derives the shared context used to score every purchase's affordability,
 * so the Wishlist page and the Purchase Analysis Drawer stay consistent.
 */
export function deriveAffordabilityBase(
  user: UserProfile,
  budgetCategories: BudgetCategory[],
  goals: FinancialGoal[]
) {
  const { totalSpent } = getBudgetTotals(budgetCategories);
  const goalMonthlyTotal = goals.reduce((sum, g) => sum + g.monthlyContribution, 0);
  const monthlyFreeCash = calculateAvailableToSpend(user.monthlySalary, totalSpent, goalMonthlyTotal);
  const emergencyFundCoverage = calculateEmergencyFundCoverage(
    user.emergencyFundCurrent,
    user.emergencyFundTarget
  );

  return {
    monthlyIncome: user.monthlySalary,
    monthlyFreeCash: Math.max(monthlyFreeCash, 500),
    liquidSavings: user.currentSavings,
    emergencyFundCoverage,
    goalMonthlyTotal,
  };
}
