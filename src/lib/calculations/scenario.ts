import type { ScenarioInput, ScenarioMonthProjection, ScenarioResult } from "@/types/finance";
import { t } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/format-date";

function monthLabelFromOffset(offset: number, start = new Date()): string {
  const date = new Date(start);
  date.setMonth(date.getMonth() + offset);
  return formatDate(date, "MMM yy");
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
        t("You're on pace to beat your {target}/month savings target by about {extra}/month.", {
          target: formatCurrency(input.savingsTarget),
          extra: formatCurrency(Math.round(averageMonthlySurplus - input.savingsTarget)),
        })
      );
    } else {
      insights.push(
        t("Your average monthly surplus of {surplus} falls short of your {target}/month savings target.", {
          surplus: formatCurrency(Math.round(averageMonthlySurplus)),
          target: formatCurrency(input.savingsTarget),
        })
      );
    }
  }

  if (cashFlowStatus === "positive") {
    insights.push(
      t("Your plan remains cash-flow positive for the full {months}-month period.", { months: input.periodMonths })
    );
  } else if (cashFlowStatus === "tight") {
    insights.push(
      t("Your projected balance dips close to your emergency reserve during this {months}-month period.", { months: input.periodMonths })
    );
  } else {
    insights.push(
      t("Your plan goes cash-flow negative at some point, with a projected low of {amount}.", { amount: formatCurrency(Math.round(lowestBalance)) })
    );
  }

  if (input.purchaseAmount > 0) {
    const purchaseMonthLabel = monthLabelFromOffset(input.purchaseMonth - 1);
    if (cashFlowStatus !== "positive") {
      insights.push(
        t("Buying in {month} pulls your reserve below a comfortable threshold — consider delaying.", { month: purchaseMonthLabel })
      );
    } else {
      insights.push(
        t("Purchasing in {month} keeps your finances stable for the rest of the period.", { month: purchaseMonthLabel })
      );
    }
  }

  if (input.salaryIncrease > 0) {
    insights.push(
      t("A salary increase of {amount}/month lifts your savings rate to about {rate}%.", { amount: formatCurrency(input.salaryIncrease), rate: savingsRate })
    );
  }

  if (input.additionalMonthlyExpense > 0) {
    insights.push(
      t("The extra {amount}/month expense reduces your long-term savings growth.", { amount: formatCurrency(input.additionalMonthlyExpense) })
    );
  }

  if (savingsRate >= 30) {
    insights.push(t("Your savings rate is excellent under this scenario — well above the recommended 20%."));
  } else if (savingsRate < 10 && savingsRate >= 0) {
    insights.push(t("Your savings rate is thin under this scenario — consider trimming lifestyle spending."));
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
