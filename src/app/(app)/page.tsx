"use client";

import { useMemo } from "react";
import { t } from "@/lib/i18n";
import { useFinance } from "@/components/providers/finance-provider";
import { BalanceHero } from "@/components/dashboard/balance-hero";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CashFlowSection } from "@/components/dashboard/cash-flow-section";
import { ExpenseBreakdownSection } from "@/components/dashboard/expense-breakdown-section";
import { BudgetProgressSection } from "@/components/dashboard/budget-progress-section";
import { FinancialHealthCard } from "@/components/dashboard/financial-health-card";
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card";
import { UpcomingCommitmentsCard } from "@/components/dashboard/upcoming-commitments-card";
import { GettingStarted } from "@/components/dashboard/getting-started";
import { AccountsStrip } from "@/components/dashboard/accounts-strip";
import { StreaksCard } from "@/components/dashboard/streaks-card";
import { ForecastCard } from "@/components/dashboard/forecast-card";
import {
  calculateSavingsRate,
  calculateAvailableToSpend,
  calculateEmergencyFundCoverage,
  calculateFinancialHealth,
  getBudgetTotals,
} from "@/lib/calculations";
import { calculateGoalProgress } from "@/lib/calculations/goals";
import { monthlyCashflow, monthTotals } from "@/lib/derive";

export default function DashboardPage() {
  const { user, budgetCategories, goals, transactions, selectedMonth, accounts, netWorth } = useFinance();

  const { income, expenses } = useMemo(() => {
    const totals = monthTotals(transactions, selectedMonth);
    return { income: totals.income || user.monthlySalary, expenses: totals.expenses };
  }, [transactions, selectedMonth, user.monthlySalary]);

  const utilization = useMemo(() => getBudgetTotals(budgetCategories).utilization, [budgetCategories]);
  const savings = income - expenses;
  const savingsRate = calculateSavingsRate(income, expenses);
  const goalMonthlyTotal = useMemo(() => goals.reduce((s, g) => s + g.monthlyContribution, 0), [goals]);
  const availableToSpend = calculateAvailableToSpend(income, expenses, goalMonthlyTotal);
  const emergencyCoverage = calculateEmergencyFundCoverage(user.emergencyFundCurrent, user.emergencyFundTarget);
  const cashflow = useMemo(() => monthlyCashflow(transactions, 6), [transactions]);

  const health = useMemo(() => {
    const goalProgressAverage =
      goals.reduce((sum, g) => sum + calculateGoalProgress(g.currentAmount, g.goalAmount), 0) / Math.max(goals.length, 1);
    return calculateFinancialHealth({
      monthlyIncome: income,
      monthlyExpenses: expenses,
      emergencyFundCurrent: user.emergencyFundCurrent,
      emergencyFundTarget: user.emergencyFundTarget,
      budgetUtilization: utilization,
      debtToIncomeRatio: 0,
      goalProgressAverage,
    });
  }, [income, expenses, user.emergencyFundCurrent, user.emergencyFundTarget, utilization, goals]);

  const topCategories = useMemo(
    () => [...budgetCategories].sort((a, b) => b.spent - a.spent).slice(0, 4),
    [budgetCategories]
  );

  return (
    <div>
      <GettingStarted />
      <BalanceHero
        name={user.name.split(" ")[0]}
        totalAssets={accounts.length ? netWorth.netWorth : user.currentSavings + user.emergencyFundCurrent}
        assetsLabel={t(accounts.length ? "Net Worth" : "Total Assets")}
        income={income}
        expenses={expenses}
        savingsRate={savingsRate}
        monthLabel={selectedMonth}
      />

      <div className="space-y-6">
        <AccountsStrip />
        <SummaryCards
          income={income}
          expenses={expenses}
          savings={savings}
          savingsRate={savingsRate}
          availableToSpend={availableToSpend}
          emergencyCurrent={user.emergencyFundCurrent}
          emergencyTarget={user.emergencyFundTarget}
          emergencyCoverage={emergencyCoverage}
          topCategories={topCategories}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <CashFlowSection data={cashflow} />
          </div>
          <FinancialHealthCard health={health} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ForecastCard />
          <StreaksCard />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ExpenseBreakdownSection categories={budgetCategories} />
          <BudgetProgressSection categories={topCategories} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentTransactionsCard transactions={transactions.slice(0, 6)} />
          <div id="commitments" className="scroll-mt-24">
            <UpcomingCommitmentsCard />
          </div>
        </div>
      </div>
    </div>
  );
}
