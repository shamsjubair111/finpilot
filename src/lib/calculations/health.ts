import type { FinancialHealth, FinancialHealthFactor } from "@/types/finance";
import { calculateSavingsRate, calculateEmergencyFundCoverage } from "./savings";

export interface HealthInputs {
  monthlyIncome: number;
  monthlyExpenses: number;
  emergencyFundCurrent: number;
  emergencyFundTarget: number;
  budgetUtilization: number; // 0-100, overall % of budget used
  debtToIncomeRatio: number; // 0-1
  goalProgressAverage: number; // 0-100 average progress across active goals
}

export function calculateFinancialHealth(inputs: HealthInputs): FinancialHealth {
  const savingsRate = calculateSavingsRate(inputs.monthlyIncome, inputs.monthlyExpenses);
  const emergencyCoverage = calculateEmergencyFundCoverage(
    inputs.emergencyFundCurrent,
    inputs.emergencyFundTarget
  );

  const factors: FinancialHealthFactor[] = [
    {
      label: "Savings Rate",
      score: Math.min(100, (savingsRate / 30) * 100),
      weight: 0.3,
      detail: `You save ${savingsRate.toFixed(0)}% of your income each month.`,
    },
    {
      label: "Emergency Fund",
      score: emergencyCoverage,
      weight: 0.25,
      detail: `Emergency fund is ${emergencyCoverage}% complete.`,
    },
    {
      label: "Budget Discipline",
      score: Math.max(0, 100 - Math.max(0, inputs.budgetUtilization - 80) * 3),
      weight: 0.2,
      detail: `Overall budget utilization is ${inputs.budgetUtilization.toFixed(0)}%.`,
    },
    {
      label: "Debt Load",
      score: Math.max(0, 100 - inputs.debtToIncomeRatio * 200),
      weight: 0.1,
      detail:
        inputs.debtToIncomeRatio === 0
          ? "You carry no active debt."
          : `Debt-to-income ratio is ${(inputs.debtToIncomeRatio * 100).toFixed(0)}%.`,
    },
    {
      label: "Goal Progress",
      score: inputs.goalProgressAverage,
      weight: 0.15,
      detail: `Average goal progress is ${inputs.goalProgressAverage.toFixed(0)}%.`,
    },
  ];

  const score = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  );

  const status: FinancialHealth["status"] =
    score >= 85 ? "Excellent" : score >= 65 ? "Healthy" : score >= 45 ? "Fair" : "At Risk";

  const insights = buildHealthInsights(factors, savingsRate, emergencyCoverage);

  return { score, status, factors, insights };
}

function buildHealthInsights(
  factors: FinancialHealthFactor[],
  savingsRate: number,
  emergencyCoverage: number
): string[] {
  const insights: string[] = [];

  if (savingsRate >= 25) {
    insights.push("Your savings rate is strong.");
  } else if (savingsRate < 15) {
    insights.push("Your savings rate could use improvement.");
  }

  insights.push(`Emergency fund is ${emergencyCoverage}% complete.`);

  const budgetFactor = factors.find((f) => f.label === "Budget Discipline");
  if (budgetFactor && budgetFactor.score < 70) {
    insights.push("One or more budget categories are close to their limit.");
  }

  const goalFactor = factors.find((f) => f.label === "Goal Progress");
  if (goalFactor && goalFactor.score >= 50) {
    insights.push("Your financial goals are progressing well.");
  }

  return insights;
}
