import type { ScenarioInput, ScenarioMonthProjection, ScenarioResult } from "@/types/finance";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthLabelFromOffset(offset: number, start = new Date()): string {
  const date = new Date(start);
  date.setMonth(date.getMonth() + offset);
  return `${MONTH_LABELS[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`;
}

/**
 * Deterministically projects income, expenses, savings and emergency fund
 * balance forward, month by month, applying a one-time salary increase and
 * additional monthly expense from month 1 onward, an optional one-time
 * bonus in month 1, and a one-time purchase deduction in the chosen month.
 */
export function runScenarioProjection(input: ScenarioInput): ScenarioResult {
  const {
    monthlySalary,
    essentialExpenses,
    lifestyleSpending,
    currentSavings,
    emergencyFund,
    purchaseAmount,
    purchaseMonth,
    salaryIncrease,
    additionalMonthlyExpense,
    bonus,
    periodMonths,
  } = input;

  const projections: ScenarioMonthProjection[] = [];
  let savingsBalance = currentSavings;
  let emergencyBalance = emergencyFund;
  let totalIncome = 0;
  let totalExpenses = 0;
  let lowestBalance = savingsBalance;

  for (let m = 1; m <= periodMonths; m++) {
    const income = monthlySalary + salaryIncrease + (m === 1 ? bonus : 0);
    const expenses = essentialExpenses + lifestyleSpending + additionalMonthlyExpense;
    const surplus = income - expenses;

    // Route a portion of surplus toward the emergency fund until it hits a
    // healthy 6x essential-expense buffer, rest toward general savings.
    const emergencyTarget = essentialExpenses * 6;
    let toEmergency = 0;
    if (emergencyBalance < emergencyTarget && surplus > 0) {
      toEmergency = Math.min(surplus * 0.3, emergencyTarget - emergencyBalance);
    }
    const toSavings = surplus - toEmergency;

    emergencyBalance += toEmergency;
    savingsBalance += toSavings;

    if (m === purchaseMonth && purchaseAmount > 0) {
      savingsBalance -= purchaseAmount;
    }

    totalIncome += income;
    totalExpenses += expenses;
    lowestBalance = Math.min(lowestBalance, savingsBalance);

    projections.push({
      month: m,
      label: monthLabelFromOffset(m - 1),
      income,
      expenses,
      savingsBalance: Math.round(savingsBalance),
      emergencyFund: Math.round(emergencyBalance),
      netCashFlow: Math.round(surplus),
    });
  }

  const totalProjectedSavings = Math.round(savingsBalance - currentSavings);
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  const cashFlowStatus: ScenarioResult["cashFlowStatus"] =
    lowestBalance < 0 ? "negative" : lowestBalance < emergencyFund * 0.5 ? "tight" : "positive";

  const riskLevel: ScenarioResult["riskLevel"] =
    cashFlowStatus === "negative" ? "high" : cashFlowStatus === "tight" ? "medium" : "low";

  const averageMonthlySurplus = (totalIncome - totalExpenses) / periodMonths;

  const insights = buildScenarioInsights({
    input,
    projections,
    lowestBalance,
    cashFlowStatus,
    savingsRate,
    averageMonthlySurplus,
  });

  return {
    projections,
    totalProjectedSavings,
    totalProjectedSpending: Math.round(totalExpenses),
    finalEmergencyFund: Math.round(emergencyBalance),
    savingsRate,
    lowestProjectedBalance: Math.round(lowestBalance),
    cashFlowStatus,
    riskLevel,
    insights,
  };
}

function buildScenarioInsights(params: {
  input: ScenarioInput;
  projections: ScenarioMonthProjection[];
  lowestBalance: number;
  cashFlowStatus: ScenarioResult["cashFlowStatus"];
  savingsRate: number;
  averageMonthlySurplus: number;
}): string[] {
  const { input, cashFlowStatus, savingsRate, lowestBalance, averageMonthlySurplus } = params;
  const insights: string[] = [];

  if (input.savingsTarget > 0) {
    if (averageMonthlySurplus >= input.savingsTarget) {
      insights.push(
        `You're on pace to beat your ${input.savingsTarget.toLocaleString()}/month savings target by about ${Math.round(
          averageMonthlySurplus - input.savingsTarget
        ).toLocaleString()}/month.`
      );
    } else {
      insights.push(
        `Your average monthly surplus of ${Math.round(averageMonthlySurplus).toLocaleString()} falls short of your ${input.savingsTarget.toLocaleString()}/month savings target.`
      );
    }
  }

  if (cashFlowStatus === "positive") {
    insights.push(
      `Your plan remains cash-flow positive for the full ${input.periodMonths}-month period.`
    );
  } else if (cashFlowStatus === "tight") {
    insights.push(
      `Your projected balance dips close to your emergency reserve during this ${input.periodMonths}-month period.`
    );
  } else {
    insights.push(
      `Your plan goes cash-flow negative at some point, with a projected low of ${Math.round(
        lowestBalance
      ).toLocaleString()}.`
    );
  }

  if (input.purchaseAmount > 0) {
    const purchaseMonthLabel = monthLabelFromOffset(input.purchaseMonth - 1);
    if (cashFlowStatus !== "positive") {
      insights.push(
        `Buying in ${purchaseMonthLabel} pulls your reserve below a comfortable threshold — consider delaying.`
      );
    } else {
      insights.push(
        `Purchasing in ${purchaseMonthLabel} keeps your finances stable for the rest of the period.`
      );
    }
  }

  if (input.salaryIncrease > 0) {
    insights.push(
      `A salary increase of ${input.salaryIncrease.toLocaleString()}/month lifts your savings rate to about ${savingsRate}%.`
    );
  }

  if (input.additionalMonthlyExpense > 0) {
    insights.push(
      `The extra ${input.additionalMonthlyExpense.toLocaleString()}/month expense reduces your long-term savings growth.`
    );
  }

  if (savingsRate >= 30) {
    insights.push("Your savings rate is excellent under this scenario — well above the recommended 20%.");
  } else if (savingsRate < 10 && savingsRate >= 0) {
    insights.push("Your savings rate is thin under this scenario — consider trimming lifestyle spending.");
  }

  return insights;
}

/**
 * Simple baseline projection using current values with no changes, used to
 * compare "Current Plan" vs the adjusted "Scenario Plan".
 */
export function runBaselineProjection(input: ScenarioInput): ScenarioResult {
  return runScenarioProjection({
    ...input,
    salaryIncrease: 0,
    additionalMonthlyExpense: 0,
    bonus: 0,
    purchaseAmount: 0,
  });
}
