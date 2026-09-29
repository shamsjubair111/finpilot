"use client";

import * as React from "react";
import { CalendarCheck, Flame, PiggyBank, Target } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/components/providers/finance-provider";
import { t } from "@/lib/i18n";
import { formatNumber } from "@/lib/currency";
import { computeStreaks } from "@/lib/streaks";

export function StreaksCard() {
  const { transactions, budgetCategories } = useFinance();
  const monthlyBudget = budgetCategories.reduce((s, b) => s + b.budgeted, 0);
  const s = React.useMemo(() => computeStreaks(transactions, monthlyBudget), [transactions, monthlyBudget]);
  if (!transactions.length) return null;

  const items = [
    { icon: Flame, value: s.noSpendDays, label: t("No-spend days in a row"), active: s.noSpendDays >= 2 },
    { icon: CalendarCheck, value: s.noSpendThisMonth, label: t("No-spend days this month"), active: s.noSpendThisMonth >= 5 },
    { icon: PiggyBank, value: s.savingMonths, label: t("Months in a row saving money"), active: s.savingMonths >= 1 },
    ...(monthlyBudget > 0 ? [{ icon: Target, value: s.underBudgetMonths, label: t("Months in a row under budget"), active: s.underBudgetMonths >= 1 }] : []),
  ];

  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle>{t("Your streaks")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((i) => (
          <div key={i.label} className={cn("rounded-xl border p-3", i.active && "border-primary/40 bg-primary/5")}>
            <i.icon className={cn("size-5", i.active ? "text-primary" : "text-muted-foreground")} />
            <p className="mt-2 text-2xl font-semibold tabular-nums">{formatNumber(i.value)}</p>
            <p className="text-xs text-muted-foreground">{i.label}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
