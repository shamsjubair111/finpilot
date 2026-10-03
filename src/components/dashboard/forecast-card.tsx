"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "cn";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/components/providers/finance-provider";
import { forecastCashflow } from "@/lib/forecast";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/format-date";
import { t } from "@/lib/i18n";
import type { AccountType } from "@/types/finance";

// Money you can actually spend this month: not savings certificates, FDRs or investments.
const SPENDABLE: AccountType[] = ["bank", "cash", "bkash", "nagad", "rocket", "upay", "e_wallet", "other"];

function Sparkline({ values }: { values: number[] }) {
  // Scale to the data so changes are visible; include zero only when the balance goes negative.
  const low = Math.min(...values);
  const min = low < 0 ? Math.min(0, low) : low;
  const max = Math.max(...values);
  const range = max - min || 1;
  const y = (v: number) => 38 - ((v - min) / range) * 36;
  const path = values.map((v, i) => `${i ? "L" : "M"}${(i / (values.length - 1)) * 100},${y(v)}`).join(" ");
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-16 w-full" aria-hidden>
      {min < 0 && <line x1="0" x2="100" y1={y(0)} y2={y(0)} className="stroke-destructive/50" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />}
      <path d={path} fill="none" className="stroke-primary" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function ForecastCard() {
  const { accounts, accountBaseBalances, commitments } = useFinance();
  const spendable = accounts.filter((a) => !a.archived && SPENDABLE.includes(a.type));
  const start = spendable.reduce((s, a) => s + (accountBaseBalances.get(a.id) ?? 0), 0);
  const spendableIds = new Set(spendable.map((a) => a.id));

  const forecast = React.useMemo(
    () =>
      forecastCashflow(
        start,
        commitments.flatMap((c) => {
          const base = { title: c.title, amount: c.amount, dueDate: c.dueDate, recurring: c.recurring, frequency: c.frequency };
          if (c.type !== "transfer") return [{ ...base, type: c.type ?? "expense" }];
          // A transfer only changes spendable money when it crosses into or out of savings (e.g. a DPS instalment).
          const fromSpendable = spendableIds.has(c.accountId ?? "");
          const toSpendable = spendableIds.has(c.toAccountId ?? "");
          if (fromSpendable === toSpendable) return [];
          return [{ ...base, type: fromSpendable ? ("expense" as const) : ("income" as const) }];
        }),
        30
      ),
    // spendableIds is derived from accounts, which `start` already tracks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [start, commitments, accounts]
  );
  if (!spendable.length) return null;

  const upcoming = forecast.points.flatMap((p) => p.events.map((e) => ({ ...e, date: p.date }))).slice(0, 5);

  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" /> {t("Next 30 days")}
        </CardTitle>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/recurring">{t("Bills")}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">{t("Spendable now")}</p>
            <p className="font-semibold tabular-nums">{formatCurrency(start)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("Lowest point")}</p>
            <p className={cn("font-semibold tabular-nums", forecast.shortfall && "text-destructive")}>{formatCurrency(forecast.lowest.balance)}</p>
            <p className="text-[11px] text-muted-foreground">{formatDate(forecast.lowest.date.toISOString(), "d MMM")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("In 30 days")}</p>
            <p className="font-semibold tabular-nums">{formatCurrency(forecast.end)}</p>
          </div>
        </div>
        <Sparkline values={forecast.points.map((p) => p.balance)} />
        {forecast.shortfall && (
          <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            {t("Your bills may outrun your money around {date}. Move some savings or delay a payment.", { date: formatDate(forecast.lowest.date.toISOString(), "d MMM") })}
          </p>
        )}
        {upcoming.length > 0 ? (
          <ul className="space-y-1.5 text-sm">
            {upcoming.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  <span className="mr-2 text-xs text-muted-foreground">{formatDate(e.date.toISOString(), "d MMM")}</span>
                  {e.title}
                </span>
                <span className={cn("shrink-0 tabular-nums", e.amount > 0 ? "text-success" : "")}>
                  {e.amount > 0 ? "+" : "−"}
                  {formatCurrency(Math.abs(e.amount))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">{t("Add your bills and salary on the Bills page to see what's coming.")}</p>
        )}
      </CardContent>
    </Card>
  );
}
