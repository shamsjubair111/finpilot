import { t } from "@/lib/i18n";
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
      detail: t("You save {rate}% of your income each month.", { rate: Math.round(savingsRate) }),
    },
    {
      label: "Emergency Fund",
      score: emergencyCoverage,
      weight: 0.25,
      detail: t("Emergency fund is {pct}% complete.", { pct: emergencyCoverage }),
    },
    {
      label: "Budget Discipline",
      score: Math.max(0, 100 - Math.max(0, inputs.budgetUtilization - 80) * 3),
      weight: 0.2,
      detail: t("Overall budget utilization is {pct}%.", { pct: Math.round(inputs.budgetUtilization) }),
    },
    {
      label: "Debt Load",
      score: Math.max(0, 100 - inputs.debtToIncomeRatio * 200),
      weight: 0.1,
      detail:
        inputs.debtToIncomeRatio === 0
          ? t("You carry no active debt.")
          : t("Debt-to-income ratio is {pct}%.", { pct: Math.round(inputs.debtToIncomeRatio * 100) }),
    },
    {
      label: "Goal Progress",
      score: inputs.goalProgressAverage,
      weight: 0.15,
      detail: t("Average goal progress is {pct}%.", { pct: Math.round(inputs.goalProgressAverage) }),
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
    insights.push(t("Your savings rate is strong."));
  } else if (savingsRate < 15) {
    insights.push(t("Your savings rate could use improvement."));
  }

  insights.push(t("Emergency fund is {pct}% complete.", { pct: emergencyCoverage }));

  const budgetFactor = factors.find((f) => f.label === "Budget Discipline");
  if (budgetFactor && budgetFactor.score < 70) {
    insights.push(t("One or more budget categories are close to their limit."));
  }

  const goalFactor = factors.find((f) => f.label === "Goal Progress");
  if (goalFactor && goalFactor.score >= 50) {
    insights.push(t("Your financial goals are progressing well."));
  }

  return insights;
}
