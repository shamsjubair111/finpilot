"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addMonths } from "date-fns";
import { AlertTriangle, HandCoins, TrendingDown } from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/components/providers/finance-provider";
import { isLiability } from "@/lib/accounts";
import { simulateDebtPayoff, type Debt, type DebtStrategy } from "@/lib/calculations";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { formatDate } from "@/lib/format-date";
import { t } from "@/lib/i18n";

const STORAGE_KEY = "sanchay.debt.v1";

const defaultMin = (type: string, balance: number) =>
  Math.ceil(type === "credit_card" ? Math.max(500, balance * 0.05) : Math.max(1000, balance * 0.02));

function Chart({ series }: { series: { label: string; values: number[]; className: string }[] }) {
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const len = Math.max(2, ...series.map((s) => s.values.length));
  const path = (values: number[]) =>
    [max, ...values].map((v, i) => `${i === 0 ? "M" : "L"}${(i / len) * 100},${40 - (v / max) * 38}`).join(" ");
  return (
    <div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-40 w-full" role="img" aria-label={t("Remaining debt over time")}>
        {series.map((s) => (
          <path key={s.label} d={path(s.values)} fill="none" strokeWidth={1.2} vectorEffect="non-scaling-stroke" className={s.className} />
        ))}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={cn("h-0.5 w-4 rounded", s.className.replace("stroke-", "bg-"))} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DebtPage() {
  const { accounts, accountBalances } = useFinance();
  const symbol = getCurrencySymbol();
  const liabilities = useMemo(
    () =>
      accounts
        .filter((a) => !a.archived && isLiability(a.type))
        .map((a) => ({ account: a, balance: Math.max(0, accountBalances.get(a.id) ?? 0) }))
        .filter((x) => x.balance > 0),
    [accounts, accountBalances]
  );

  const [mins, setMins] = useState<Record<string, string>>({});
  const [rates, setRates] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState("");
  const [strategy, setStrategy] = useState<DebtStrategy>("avalanche");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (!saved) return;
      // Restore this device's saved plan after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMins(saved.mins ?? {});
      setRates(saved.rates ?? {});
      setExtra(saved.extra ?? "");
      if (saved.strategy) setStrategy(saved.strategy);
    } catch {
      // Storage unavailable: use defaults.
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mins, rates, extra, strategy }));
    } catch {
      // Ignore: saving is only a convenience.
    }
  }, [mins, rates, extra, strategy]);

  const debts: Debt[] = useMemo(
    () =>
      liabilities.map(({ account, balance }) => ({
        id: account.id,
        name: account.name,
        balance,
        rate: Number(rates[account.id] ?? account.interestRate ?? 0) || 0,
        minPayment: Number(mins[account.id] ?? defaultMin(account.type, balance)) || 0,
      })),
    [liabilities, rates, mins]
  );
  const extraAmount = Math.max(0, Number(extra) || 0);

  const plans = useMemo(
    () => ({
      avalanche: simulateDebtPayoff(debts, extraAmount, "avalanche"),
      snowball: simulateDebtPayoff(debts, extraAmount, "snowball"),
      minimumOnly: simulateDebtPayoff(debts, 0, strategy),
    }),
    [debts, extraAmount, strategy]
  );
  const plan = plans[strategy];
  const now = new Date();
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const saved = plans.minimumOnly.totalInterest - plan.totalInterest;

  if (!liabilities.length)
    return (
      <div>
        <PageHeader title={t("Debt payoff planner")} subtitle={t("Clear loans and cards faster with a clear plan.")} />
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={HandCoins}
              title={t("No debts to plan")}
              description={t("Add a loan or credit card account with a balance, and its interest rate, to build a payoff plan.")}
              action={<Button asChild size="sm"><Link href="/accounts">{t("Go to accounts")}</Link></Button>}
            />
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader title={t("Debt payoff planner")} subtitle={t("Clear loans and cards faster with a clear plan.")} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: t("Total debt"), value: formatCurrency(totalDebt) },
          { label: t("Debt-free by"), value: plan.neverPaysOff ? "—" : formatDate(addMonths(now, plan.months).toISOString(), "MMM yyyy") },
          { label: t("Interest you'll pay"), value: formatCurrency(plan.totalInterest) },
          { label: t("Saved by paying extra"), value: saved > 0 ? formatCurrency(saved) : "—" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{s.value}</p>
          </Card>
        ))}
      </div>

      {plan.neverPaysOff && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          {t("These payments don't cover the interest, so the debt keeps growing. Increase the monthly payments.")}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Your debts")}</CardTitle>
            <CardDescription>{t("Set each minimum payment and interest rate. They're saved on this device.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {debts.map((d, i) => (
              <div key={d.id} className="grid grid-cols-2 items-end gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_7rem_8rem_7rem]">
                <div className="col-span-2 sm:col-span-1">
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(d.balance)} · #{i + 1}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`rate-${d.id}`}>{t("Interest %/yr")}</Label>
                  <Input id={`rate-${d.id}`} inputMode="decimal" value={rates[d.id] ?? String(d.rate)} onChange={(e) => setRates({ ...rates, [d.id]: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`min-${d.id}`}>{t("Minimum ({symbol})", { symbol })}</Label>
                  <Input id={`min-${d.id}`} inputMode="decimal" value={mins[d.id] ?? String(d.minPayment)} onChange={(e) => setMins({ ...mins, [d.id]: e.target.value })} className="h-9" />
                </div>
                <div className="text-right text-sm">
                  <p className="text-xs text-muted-foreground">{t("Paid off")}</p>
                  <p className="font-medium">
                    {plan.payoffMonth[d.id] ? formatDate(addMonths(now, plan.payoffMonth[d.id]).toISOString(), "MMM yyyy") : "—"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Your plan")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="debt-extra">{t("Extra each month ({symbol})", { symbol })}</Label>
                <Input id="debt-extra" inputMode="decimal" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                {(["avalanche", "snowball"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStrategy(s)}
                    className={cn("w-full rounded-xl border p-3 text-left transition-colors", strategy === s ? "border-primary bg-primary/5" : "hover:bg-muted")}
                  >
                    <p className="flex items-center justify-between text-sm font-medium">
                      {s === "avalanche" ? t("Avalanche") : t("Snowball")}
                      <span className="tabular-nums text-muted-foreground">
                        {plans[s].neverPaysOff ? "—" : t("{n} months", { n: plans[s].months })}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s === "avalanche"
                        ? t("Highest interest first. Saves the most money.")
                        : t("Smallest balance first. Quick wins keep you motivated.")}
                    </p>
                    <p className="mt-1 text-xs">{t("Interest: {amount}", { amount: formatCurrency(plans[s].totalInterest) })}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="size-4" />
            {t("Remaining debt over time")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Chart
            series={[
              { label: t("With your plan"), values: plan.balances, className: "stroke-primary" },
              { label: t("Minimums only"), values: plans.minimumOnly.balances, className: "stroke-muted-foreground" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
