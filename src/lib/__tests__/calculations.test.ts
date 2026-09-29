import { describe, expect, it } from "vitest";
import {
  calculateAvailableToSpend,
  calculateEmergencyFundCoverage,
  calculateEmergencyFundMonths,
  calculateFinancialHealth,
  calculateGoalProgress,
  calculateGoalRemaining,
  calculateMonthlySurplus,
  calculateMonthsToGoal,
  calculateSavingsRate,
  estimateCompletionDate,
  getBudgetStatus,
  getBudgetTotals,
  getBudgetUtilization,
} from "@/lib/calculations";
import type { BudgetCategory } from "@/types/finance";

describe("savings", () => {
  it("computes surplus and savings rate", () => {
    expect(calculateMonthlySurplus(50000, 30000)).toBe(20000);
    expect(calculateSavingsRate(50000, 30000)).toBe(40);
    expect(calculateSavingsRate(0, 100)).toBe(0);
    expect(calculateSavingsRate(1000, 2000)).toBe(0);
  });

  it("never reports negative money available to spend", () => {
    expect(calculateAvailableToSpend(50000, 30000, 5000)).toBe(15000);
    expect(calculateAvailableToSpend(10000, 30000, 5000)).toBe(0);
  });

  it("caps emergency fund coverage and handles zero targets", () => {
    expect(calculateEmergencyFundCoverage(50, 100)).toBe(50);
    expect(calculateEmergencyFundCoverage(500, 100)).toBe(100);
    expect(calculateEmergencyFundCoverage(50, 0)).toBe(0);
    expect(calculateEmergencyFundMonths(90000, 30000)).toBe(3);
    expect(calculateEmergencyFundMonths(1, 0)).toBe(0);
  });
});

describe("goals", () => {
  it("computes progress, remaining and months", () => {
    expect(calculateGoalProgress(250, 1000)).toBe(25);
    expect(calculateGoalProgress(2000, 1000)).toBe(100);
    expect(calculateGoalProgress(1, 0)).toBe(0);
    expect(calculateGoalRemaining(1200, 1000)).toBe(0);
    expect(calculateMonthsToGoal(0, 1000, 300)).toBe(4);
    expect(calculateMonthsToGoal(1000, 1000, 0)).toBe(0);
    expect(calculateMonthsToGoal(0, 1000, 0)).toBe(Infinity);
  });

  it("adds months to a date without mutating it", () => {
    const from = new Date(2026, 0, 15);
    const out = estimateCompletionDate(3, from);
    expect(out.getMonth()).toBe(3);
    expect(from.getMonth()).toBe(0);
  });
});

describe("budget", () => {
  const cats = [
    { id: "a", category: "Food", budgeted: 1000, spent: 900 },
    { id: "b", category: "Rent", budgeted: 1000, spent: 500 },
  ] as unknown as BudgetCategory[];

  it("classifies status by utilization", () => {
    expect(getBudgetStatus(500, 1000)).toBe("on_track");
    expect(getBudgetStatus(850, 1000)).toBe("near_limit");
    expect(getBudgetStatus(1001, 1000)).toBe("over_budget");
    expect(getBudgetStatus(10, 0)).toBe("on_track");
  });

  it("totals categories", () => {
    expect(getBudgetUtilization(cats)).toBe(70);
    expect(getBudgetTotals(cats)).toMatchObject({ totalBudgeted: 2000, totalSpent: 1400, remaining: 600 });
  });
});

describe("financial health", () => {
  it("returns a bounded score", () => {
    const h = calculateFinancialHealth({
      monthlyIncome: 50000,
      monthlyExpenses: 30000,
      emergencyFundCurrent: 60000,
      emergencyFundTarget: 120000,
      budgetUtilization: 70,
      debtToIncomeRatio: 0.1,
      goalProgressAverage: 40,
    });
    expect(h.score).toBeGreaterThanOrEqual(0);
    expect(h.score).toBeLessThanOrEqual(100);
  });
});
