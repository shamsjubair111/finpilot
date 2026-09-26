"use client";

import { ArrowDownRight, ArrowUpRight, Wallet2, TrendingDown, PiggyBank } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/currency";
import { formatDate } from "@/lib/format-date";
import { t } from "@/lib/i18n";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function BalanceHero({
  name,
  totalAssets,
  income,
  expenses,
  savingsRate,
  monthLabel,
  assetsLabel,
}: {
  assetsLabel?: string;
  name: string;
  totalAssets: number;
  income: number;
  expenses: number;
  savingsRate: number;
  monthLabel: string;
}) {
  const net = income - expenses;
  return (
    <div className="bg-mesh-hero relative mb-6 overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-card animate-in-up sm:mb-8 sm:p-8">
      <div className="orb -right-16 -top-20 size-72 bg-primary/25" />
      <div className="orb -bottom-24 left-1/3 size-64 bg-[var(--cat-6)]/15 [animation-delay:-6s]" />
      <div className="grid-lines absolute inset-0 opacity-50" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t(getGreeting())}, {name}
            </p>
            <p className="text-xs text-muted-foreground/80">{t("Here's how your money looks in {month}.", { month: formatDate(monthLabel, "MMMM yyyy") })}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{assetsLabel ?? t("Total Assets")}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-gradient-primary sm:text-[2.75rem]">
              {formatCurrency(totalAssets)}
            </p>
            <p className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${net >= 0 ? "text-success" : "text-destructive"}`}>
              {net >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {t("Net {amount} this month", { amount: formatCurrency(net, { compact: true, signDisplay: "always" }) })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <HeroStat icon={Wallet2} label={t("Income")} value={formatCurrency(income, { compact: true })} tone="primary" />
          <HeroStat icon={TrendingDown} label={t("Spending")} value={formatCurrency(expenses, { compact: true })} tone="destructive" />
          <HeroStat icon={PiggyBank} label={t("Savings Rate")} value={`${formatNumber(Math.round(savingsRate))}%`} tone="success" />
        </div>
      </div>
    </div>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet2;
  label: string;
  value: string;
  tone: "primary" | "destructive" | "success";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  }[tone];

  return (
    <div className="glass min-w-0 rounded-2xl p-3 sm:min-w-[120px] sm:p-4">
      <div className={`mb-2 flex size-7 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="size-3.5" />
      </div>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold tabular-nums sm:text-base">{value}</p>
    </div>
  );
}
