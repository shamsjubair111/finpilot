"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { SavingsGrowthChart } from "@/components/charts/savings-growth-chart";
import { SpendingTrendChart } from "@/components/charts/spending-trend-chart";
import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { MetricLineChart } from "@/components/charts/metric-line-chart";
import { GoalProgressBarChart } from "@/components/charts/goal-progress-bar-chart";
import { NetCashflowChart } from "@/components/charts/net-cashflow-chart";
import { useFinance } from "@/components/providers/finance-provider";
import { monthlyCashflow } from "@/lib/derive";
import { formatCurrency } from "@/lib/currency";
import { calculateGoalProgress } from "@/lib/calculations/goals";
import { t } from "@/lib/i18n";

const RANGE_OPTIONS = [
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "12", label: "12 months" },
  { value: "ytd", label: "This year" },
];

export default function ReportsPage() {
  const { budgetCategories, goals, user, transactions } = useFinance();
  const [range, setRange] = useState("6");

  const rangedData = useMemo(() => {
    const months = range === "ytd" ? new Date().getMonth() + 1 : Number(range);
    return monthlyCashflow(transactions, months);
  }, [range, transactions]);

  const savingsGrowthData = useMemo(() => {
    const startingBalance = user.currentSavings - rangedData.reduce((s, m) => s + m.savings, 0);
    return rangedData.reduce<{ month: string; balance: number }[]>((acc, m) => {
      const previous = acc.length > 0 ? acc[acc.length - 1].balance : startingBalance;
      acc.push({ month: m.month, balance: Math.round(previous + m.savings) });
      return acc;
    }, []);
  }, [rangedData, user.currentSavings]);

  const savingsRateData = useMemo(
    () => rangedData.map((m) => ({ month: m.month, rate: m.income > 0 ? Math.round((m.savings / m.income) * 100) : 0 })),
    [rangedData]
  );

  const netCashflowData = useMemo(
    () => rangedData.map((m) => ({ month: m.month, net: m.income - m.expenses })),
    [rangedData]
  );

  const goalProgressData = useMemo(
    () => goals.map((g) => ({ name: g.name, progress: calculateGoalProgress(g.currentAmount, g.goalAmount) })),
    [goals]
  );

  return (
    <div>
      <PageHeader
        title={t("Reports")}
        subtitle={t("Deeper visual breakdowns of your financial trends.")}
        actions={
          <>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/reports/statement"><FileText className="size-4" />{t("Monthly statement")}</Link>
          </Button>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {t(o.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </>
        }
      />

      {transactions.length === 0 && (
        <div className="mb-6 rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          {t("Reports fill in as you record transactions. Add a few income and expense entries to see your trends.")}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="animate-in-up min-w-0">
          <CardHeader>
            <CardTitle>{t("Income vs Expenses")}</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={rangedData} />
          </CardContent>
        </Card>

        <Card className="animate-in-up min-w-0">
          <CardHeader>
            <CardTitle>{t("Savings Growth")}</CardTitle>
            <CardDescription>{t("Cumulative savings balance over the selected period")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SavingsGrowthChart data={savingsGrowthData} />
          </CardContent>
        </Card>

        <Card className="animate-in-up min-w-0">
          <CardHeader>
            <CardTitle>{t("Monthly Spending Trend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingTrendChart data={rangedData.map((m) => ({ month: m.month, expenses: m.expenses }))} />
          </CardContent>
        </Card>

        <Card className="animate-in-up min-w-0">
          <CardHeader>
            <CardTitle>{t("Category Spending")}</CardTitle>
            <CardDescription>{t("Current month breakdown by category")}</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBarChart categories={budgetCategories} />
          </CardContent>
        </Card>

        <Card className="animate-in-up min-w-0">
          <CardHeader>
            <CardTitle>{t("Savings Rate")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricLineChart
              data={savingsRateData}
              dataKey="rate"
              name={t("Savings Rate")}
              color="var(--chart-1)"
              valueFormatter={(v) => `${v}%`}
            />
          </CardContent>
        </Card>

        <Card className="animate-in-up min-w-0">
          <CardHeader>
            <CardTitle>{t("Goal Progress")}</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalProgressBarChart data={goalProgressData} />
          </CardContent>
        </Card>

        <Card className="animate-in-up xl:col-span-2">
          <CardHeader>
            <CardTitle>{t("Net Cash Flow")}</CardTitle>
            <CardDescription>
              {t("Total across period:")}{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(rangedData.reduce((s, m) => s + (m.income - m.expenses), 0))}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NetCashflowChart data={netCashflowData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
