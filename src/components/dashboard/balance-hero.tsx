"use client";

import { ArrowUpRight, Wallet2, TrendingDown, PiggyBank } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

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
}: {
  name: string;
  totalAssets: number;
  income: number;
  expenses: number;
  savingsRate: number;
}) {
  return (
    <div className="bg-mesh-hero relative mb-6 overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-card sm:mb-8 sm:p-8">
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {getGreeting()}, {name}
            </p>
            <p className="text-xs text-muted-foreground/80">Here&apos;s how your money is looking this month.</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Total Assets</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-gradient-primary sm:text-[2.75rem]">
              {formatCurrency(totalAssets)}
            </p>
            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-success">
              <ArrowUpRight className="size-3.5" />
              Up {formatCurrency(income - expenses, { compact: true })} this month
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <HeroStat icon={Wallet2} label="Income" value={formatCurrency(income, { compact: true })} tone="primary" />
          <HeroStat icon={TrendingDown} label="Spending" value={formatCurrency(expenses, { compact: true })} tone="destructive" />
          <HeroStat icon={PiggyBank} label="Savings Rate" value={`${Math.round(savingsRate)}%`} tone="success" />
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
    <div className="min-w-[104px] rounded-xl border border-border/70 bg-background/60 p-3.5 backdrop-blur-sm sm:min-w-[120px] sm:p-4">
      <div className={`mb-2 flex size-7 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="size-3.5" />
      </div>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}
