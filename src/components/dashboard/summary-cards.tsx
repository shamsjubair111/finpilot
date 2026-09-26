"use client";

import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Percent,
  HandCoins,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import { formatCurrency } from "@/lib/currency";
import { GLOSSARY } from "@/lib/glossary";
import { CATEGORY_COLORS } from "@/lib/chart-colors";
import type { BudgetCategory } from "@/types/finance";
import { cn } from "cn";
import { formatNumber } from "@/lib/currency";
import { t } from "@/lib/i18n";

interface SummaryCardsProps {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  availableToSpend: number;
  emergencyCurrent: number;
  emergencyTarget: number;
  emergencyCoverage: number;
  topCategories: BudgetCategory[];
}

export function SummaryCards({
  income,
  expenses,
  savings,
  savingsRate,
  availableToSpend,
  emergencyCurrent,
  emergencyTarget,
  emergencyCoverage,
  topCategories,
}: SummaryCardsProps) {
  const totalSpent = topCategories.reduce((s, c) => s + c.spent, 0) || 1;

  return (
    <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Monthly Income */}
      <Card className="card-hover animate-in-up gap-3 p-5">
        <div className="flex items-start justify-between">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-[18px]" strokeWidth={2} />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{t("Monthly Income")}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(income)}</p>
          <p className="text-xs text-muted-foreground">{t("Income recorded this month (or your set salary)")}</p>
        </div>
      </Card>

      {/* Monthly Spending with mini category breakdown */}
      <Card className="card-hover animate-in-up gap-3 p-5">
        <div className="flex items-start justify-between">
          <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <TrendingDown className="size-[18px]" strokeWidth={2} />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            {t("of {amount}", { amount: formatCurrency(income) })}
          </span>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("Monthly Spending")}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(expenses)}</p>
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
            {topCategories.map((c) => (
              <div
                key={c.id}
                style={{
                  width: `${(c.spent / totalSpent) * 100}%`,
                  backgroundColor: CATEGORY_COLORS[c.category],
                }}
                className="h-full first:rounded-l-full last:rounded-r-full"
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {topCategories[0]?.spent
              ? t("Top: {category} ({amount})", { category: t(topCategories[0].category), amount: formatCurrency(topCategories[0].spent, { compact: true }) })
              : t("No budgeted spending yet")}
          </p>
        </div>
      </Card>

      {/* Monthly Savings */}
      <Card className="card-hover animate-in-up gap-3 p-5">
        <div className="flex items-start justify-between">
          <div className="flex size-9 items-center justify-center rounded-lg bg-success/10 text-success">
            <PiggyBank className="size-[18px]" strokeWidth={2} />
          </div>
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium", savings >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
            {t(savings >= 0 ? "Surplus" : "Deficit")}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{t("Monthly Savings")}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(savings)}</p>
          <p className="text-xs text-muted-foreground">{t("Income minus expenses this month")}</p>
        </div>
      </Card>

      {/* Savings Rate — ring style */}
      <Card className="card-hover animate-in-up gap-3 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">{t("Savings Rate")}</p>
            <InfoTooltip text={t(GLOSSARY.savingsRate)} />
          </div>
          <Percent className="size-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex size-16 shrink-0 items-center justify-center">
            <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--muted)" strokeWidth="3.5" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(savingsRate, 100) * 0.974} 100`}
              />
            </svg>
            <span className="absolute text-sm font-semibold tabular-nums">{formatNumber(Math.round(savingsRate))}%</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {t("Recommended:")} <span className="font-medium text-foreground">{formatNumber(20)}%+</span>
            </p>
            <p className={cn("text-xs font-medium", savingsRate >= 25 ? "text-success" : "text-warning")}>
              {t(savingsRate >= 25 ? "Excellent pace" : "Could improve")}
            </p>
          </div>
        </div>
      </Card>

      {/* Available to Spend */}
      <Card className="card-hover animate-in-up gap-3 p-5">
        <div className="flex items-start justify-between">
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <HandCoins className="size-[18px]" strokeWidth={2} />
          </div>
          <InfoTooltip text={t(GLOSSARY.availableToSpend)} />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{t("Available to Spend")}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(availableToSpend)}</p>
          <p className="text-xs text-muted-foreground">{t("After expenses & goal contributions")}</p>
        </div>
      </Card>

      {/* Emergency Fund */}
      <Card className="card-hover animate-in-up gap-3 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-[18px]" strokeWidth={2} />
            </div>
          </div>
          <span className="text-xs font-semibold text-primary">{formatNumber(emergencyCoverage)}%</span>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t("Emergency Fund")}</p>
          <p className="text-lg font-semibold tracking-tight tabular-nums">
            {formatCurrency(emergencyCurrent, { compact: true })}
            <span className="text-sm font-normal text-muted-foreground"> / {formatCurrency(emergencyTarget, { compact: true })}</span>
          </p>
          <Progress value={emergencyCoverage} className="h-1.5" />
        </div>
      </Card>
    </div>
  );
}
