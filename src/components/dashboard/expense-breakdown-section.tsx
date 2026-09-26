"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseDonutChart } from "@/components/charts/expense-donut-chart";
import { CATEGORY_COLORS } from "@/lib/chart-colors";
import { formatCurrency, formatNumber } from "@/lib/currency";
import { t } from "@/lib/i18n";
import type { BudgetCategory } from "@/types/finance";
import { PieChart } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export function ExpenseBreakdownSection({ categories }: { categories: BudgetCategory[] }) {
  const total = categories.reduce((sum, c) => sum + c.spent, 0);
  const sorted = [...categories].sort((a, b) => b.spent - a.spent);

  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle>{t("Expense Breakdown")}</CardTitle>
      </CardHeader>
      {total === 0 ? (
        <CardContent>
          <EmptyState icon={PieChart} title={t("No spending to break down")} description={t("Expenses in your budget categories for the selected month will appear here.")} />
        </CardContent>
      ) : (
      <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:items-center">
        <ExpenseDonutChart categories={categories} />
        <ul className="space-y-2.5">
          {sorted.map((c) => {
            const pct = total > 0 ? Math.round((c.spent / total) * 100) : 0;
            return (
              <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[c.category] }}
                  />
                  <span className="truncate">{t(c.category)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 tabular-nums">
                  <span className="font-medium">{formatCurrency(c.spent, { compact: true })}</span>
                  <span className="w-9 text-right text-xs text-muted-foreground">{formatNumber(pct)}%</span>
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
      )}
    </Card>
  );
}
