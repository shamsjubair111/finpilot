"use client";

import { useMemo } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { BalanceHero } from "@/components/dashboard/balance-hero";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CashFlowSection } from "@/components/dashboard/cash-flow-section";
import { ExpenseBreakdownSection } from "@/components/dashboard/expense-breakdown-section";
import { BudgetProgressSection } from "@/components/dashboard/budget-progress-section";
import { FinancialHealthCard } from "@/components/dashboard/financial-health-card";
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card";
import { UpcomingCommitmentsCard } from "@/components/dashboard/upcoming-commitments-card";
import { mockMonthlyCashFlow } from "@/data/mock-cashflow";
import { mockCommitments } from "@/data/mock-commitments";
import { getRecentTransactions } from "@/data/mock-transactions";
import {
  calculateSavingsRate,
  calculateAvailableToSpend,
  calculateEmergencyFundCoverage,
  calculateFinancialHealth,
  getBudgetTotals,
} from "@/lib/calculations";
import { calculateGoalProgress } from "@/lib/calculations/goals";

export default function DashboardPage() {
  const { user, budgetCategories, goals } = useFinance();

  const { totalSpent, utilization } = useMemo(() => {
    const totals = getBudgetTotals(budgetCategories);
    return { totalSpent: totals.totalSpent, utilization: totals.utilization };
  }, [budgetCategories]);

  const income = user.monthlySalary;
  const savings = income - totalSpent;
  const savingsRate = calculateSavingsRate(income, totalSpent);
  const goalMonthlyTotal = useMemo(() => goals.reduce((s, g) => s + g.monthlyContribution, 0), [goals]);
  const availableToSpend = calculateAvailableToSpend(income, totalSpent, goalMonthlyTotal);
  const emergencyCoverage = calculateEmergencyFundCoverage(
    user.emergencyFundCurrent,
    user.emergencyFundTarget
  );

  const health = useMemo(() => {
    const goalProgressAverage =
      goals.reduce((sum, g) => sum + calculateGoalProgress(g.currentAmount, g.goalAmount), 0) /
      Math.max(goals.length, 1);

    return calculateFinancialHealth({
      monthlyIncome: income,
      monthlyExpenses: totalSpent,
      emergencyFundCurrent: user.emergencyFundCurrent,
      emergencyFundTarget: user.emergencyFundTarget,
      budgetUtilization: utilization,
      debtToIncomeRatio: 0,
      goalProgressAverage,
    });
  }, [income, totalSpent, user.emergencyFundCurrent, user.emergencyFundTarget, utilization, goals]);

  const topCategories = useMemo(
    () => [...budgetCategories].sort((a, b) => b.spent - a.spent).slice(0, 4),
    [budgetCategories]
  );

  const recentTransactions = useMemo(() => getRecentTransactions(6), []);

  return (
    <div>
      <BalanceHero
        name={user.name}
        totalAssets={user.currentSavings + user.emergencyFundCurrent}
        income={income}
        expenses={totalSpent}
        savingsRate={savingsRate}
      />

      <div className="space-y-6">
        <SummaryCards
          income={income}
          expenses={totalSpent}
          savings={savings}
          savingsRate={savingsRate}
          availableToSpend={availableToSpend}
          emergencyCurrent={user.emergencyFundCurrent}
          emergencyTarget={user.emergencyFundTarget}
          emergencyCoverage={emergencyCoverage}
          topCategories={topCategories}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CashFlowSection data={mockMonthlyCashFlow} />
          </div>
          <FinancialHealthCard health={health} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ExpenseBreakdownSection categories={budgetCategories} />
          <BudgetProgressSection categories={budgetCategories.slice(0, 4)} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentTransactionsCard transactions={recentTransactions} />
          <UpcomingCommitmentsCard commitments={mockCommitments} />
        </div>
      </div>
    </div>
  );
}
