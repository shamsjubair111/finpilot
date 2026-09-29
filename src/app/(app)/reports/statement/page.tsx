"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogoMark } from "@/components/brand/logo-mark";
import { useFinance } from "@/components/providers/finance-provider";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/format-date";
import { getLang, localDigits, t } from "@/lib/i18n";

// Years go through as text so they aren't formatted with a thousands separator.
const localYear = (y: number) => localDigits(String(y), getLang());
import { buildStatement } from "@/lib/statement";

export default function StatementPage() {
  return (
    <Suspense>
      <Statement />
    </Suspense>
  );
}

function pctChange(now: number, before: number) {
  if (!before) return null;
  return ((now - before) / before) * 100;
}

function Change({ now, before, goodWhenUp }: { now: number; before: number; goodWhenUp: boolean }) {
  const c = pctChange(now, before);
  if (c === null || Math.abs(c) < 0.5) return null;
  const good = goodWhenUp ? c > 0 : c < 0;
  return (
    <span className={cn("text-xs", good ? "text-success" : "text-destructive")}>
      {c > 0 ? "▲" : "▼"} {Math.abs(Math.round(c))}%
    </span>
  );
}

function Statement() {
  const router = useRouter();
  const params = useSearchParams();
  const { transactions, budgetCategories, user } = useFinance();
  const now = new Date();

  const period = params.get("period") === "year" ? "year" : "month";
  const monthParam = params.get("month");
  const yearParam = Number(params.get("year")) || now.getFullYear();
  const [y, m] = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];

  const from = period === "year" ? new Date(yearParam, 0, 1) : new Date(y, m - 1, 1);
  const to = period === "year" ? new Date(yearParam + 1, 0, 1) : new Date(y, m, 1);
  const s = useMemo(
    () => buildStatement(transactions, budgetCategories, from, to, period === "year" ? 12 : 1),
    // from/to are derived from the URL values listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, budgetCategories, period, y, m, yearParam]
  );

  const title = period === "year" ? t("Year in review {year}", { year: localYear(yearParam) }) : formatDate(from.toISOString(), "MMMM yyyy");
  const monthOptions = Array.from({ length: 24 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - i, 1));
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const go = (q: string) => router.replace(`/reports/statement?${q}`);
  const selectValue = period === "year" ? `year:${yearParam}` : `month:${y}-${String(m).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/reports"><ArrowLeft className="size-4" />{t("Reports")}</Link>
        </Button>
        <div className="flex gap-2">
          <Select value={selectValue} onValueChange={(v) => go(v.startsWith("year:") ? `period=year&year=${v.slice(5)}` : `period=month&month=${v.slice(6)}`)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((yr) => (
                <SelectItem key={`y${yr}`} value={`year:${yr}`}>{t("Year in review {year}", { year: localYear(yr) })}</SelectItem>
              ))}
              {monthOptions.map((d) => {
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                return <SelectItem key={key} value={`month:${key}`}>{formatDate(d.toISOString(), "MMMM yyyy")}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="size-4" />
            {t("Print / Save PDF")}
          </Button>
        </div>
      </div>

      <article className="rounded-2xl border bg-card p-6 text-card-foreground sm:p-10 print:rounded-none print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-4 border-b pb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("Financial statement")}</p>
            <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user.name} · {user.email}</p>
          </div>
          <LogoMark className="size-10" />
        </header>

        <section className="grid grid-cols-2 gap-4 border-b py-6 sm:grid-cols-4">
          {[
            { label: t("Income"), value: s.income, change: <Change now={s.income} before={s.previous.income} goodWhenUp /> },
            { label: t("Expenses"), value: s.expenses, change: <Change now={s.expenses} before={s.previous.expenses} goodWhenUp={false} /> },
            { label: t("Net savings"), value: s.net },
            { label: t("Savings rate"), text: `${Math.round(s.savingsRate)}%` },
          ].map((k) => (
            <div key={k.label}>
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={cn("text-lg font-semibold tabular-nums", k.value !== undefined && k.value < 0 && "text-destructive")}>
                {k.text ?? formatCurrency(k.value!)}
              </p>
              {k.change}
            </div>
          ))}
        </section>

        {s.count === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("No transactions in this period.")}</p>
        ) : (
          <>
            <section className="border-b py-6">
              <h2 className="mb-3 font-semibold">{t("Where the money went")}</h2>
              <div className="space-y-2">
                {s.byCategory.map((c) => (
                  <div key={c.category} className="grid grid-cols-[8rem_1fr_6rem] items-center gap-3 text-sm">
                    <span className="truncate">{t(c.category)}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-muted print:border">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(2, c.share)}%` }} />
                    </span>
                    <span className="text-right tabular-nums">{formatCurrency(c.amount)}</span>
                  </div>
                ))}
              </div>
            </section>

            {s.incomeByCategory.length > 0 && (
              <section className="border-b py-6">
                <h2 className="mb-3 font-semibold">{t("Income sources")}</h2>
                <table className="w-full text-sm">
                  <tbody>
                    {s.incomeByCategory.map((c) => (
                      <tr key={c.category}>
                        <td className="py-1">{t(c.category)}</td>
                        <td className="py-1 text-right tabular-nums">{formatCurrency(c.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {s.budgets.length > 0 && (
              <section className="border-b py-6 print:break-inside-avoid">
                <h2 className="mb-3 font-semibold">{t("Budget vs actual")}</h2>
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="py-1 text-left font-normal">{t("Category")}</th>
                      <th className="py-1 text-right font-normal">{t("Budget")}</th>
                      <th className="py-1 text-right font-normal">{t("Spent")}</th>
                      <th className="py-1 text-right font-normal">{t("Left")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.budgets.map((b) => (
                      <tr key={b.category}>
                        <td className="py-1">{t(b.category)}</td>
                        <td className="py-1 text-right tabular-nums">{formatCurrency(b.budgeted)}</td>
                        <td className="py-1 text-right tabular-nums">{formatCurrency(b.spent)}</td>
                        <td className={cn("py-1 text-right tabular-nums", b.spent > b.budgeted && "text-destructive")}>{formatCurrency(b.budgeted - b.spent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            <section className="py-6 print:break-inside-avoid">
              <h2 className="mb-3 font-semibold">{t("Largest expenses")}</h2>
              <table className="w-full text-sm">
                <tbody>
                  {s.topExpenses.map((x) => (
                    <tr key={x.id}>
                      <td className="w-24 py-1 text-muted-foreground">{formatDate(x.date, "d MMM")}</td>
                      <td className="py-1">{x.title}</td>
                      <td className="py-1 text-muted-foreground">{t(x.category)}</td>
                      <td className="py-1 text-right tabular-nums">{formatCurrency(x.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}

        <footer className="border-t pt-4 text-xs text-muted-foreground">
          {t("Generated by Sanchay on {date}. Transfers between your own accounts are not counted as income or expenses.", { date: formatDate(now.toISOString(), "d MMM yyyy") })}
        </footer>
      </article>
    </div>
  );
}
