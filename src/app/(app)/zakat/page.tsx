"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, RefreshCw, Scale } from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/components/providers/finance-provider";
import { isLiability } from "@/lib/accounts";
import { calculateZakat, NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS, ZAKAT_RATE, type ZakatInput } from "@/lib/calculations";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { t } from "@/lib/i18n";

type Fields = Record<Exclude<keyof ZakatInput, "nisabStandard">, string>;

// Metal holdings and prices are remembered on this device only, for convenience next year.
const STORAGE_KEY = "sanchay.zakat.v1";
const REMEMBERED: (keyof Fields)[] = ["goldGrams", "silverGrams", "goldPricePerGram", "silverPricePerGram", "businessAssets", "receivables"];

const num = (v: string) => {
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const str = (n: number) => (n ? String(Math.round(n * 100) / 100) : "");

export default function ZakatPage() {
  const { accounts, accountBalances } = useFinance();
  const symbol = getCurrencySymbol();

  const fromAccounts = useMemo(() => {
    let cash = 0, savings = 0, investments = 0, cardDebt = 0;
    for (const a of accounts) {
      if (a.archived) continue;
      const b = accountBalances.get(a.id) ?? 0;
      if (a.type === "credit_card") cardDebt += Math.max(0, b);
      else if (isLiability(a.type)) continue;
      else if (a.type === "savings") savings += Math.max(0, b);
      else if (a.type === "investment") investments += Math.max(0, b);
      else cash += Math.max(0, b);
    }
    return { cash, savings, investments, cardDebt };
  }, [accounts, accountBalances]);

  const [standard, setStandard] = useState<"gold" | "silver">("silver");
  const [f, setF] = useState<Fields>(() => ({
    cash: str(fromAccounts.cash),
    savings: str(fromAccounts.savings),
    investments: str(fromAccounts.investments),
    debtsDue: str(fromAccounts.cardDebt),
    goldGrams: "",
    silverGrams: "",
    goldPricePerGram: "",
    silverPricePerGram: "",
    businessAssets: "",
    receivables: "",
  }));

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as (Partial<Fields> & { standard?: "gold" | "silver" }) | null;
      if (!saved) return;
      // Restoring device-local values can only happen after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setF((prev) => ({ ...prev, ...Object.fromEntries(REMEMBERED.map((k) => [k, saved[k] ?? prev[k]])) }));
      if (saved.standard) setStandard(saved.standard);
    } catch {
      // Storage unavailable (private mode): start blank.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...Object.fromEntries(REMEMBERED.map((k) => [k, f[k]])), standard }));
    } catch {
      // Ignore: remembering is only a convenience.
    }
  }, [f, standard]);

  const result = calculateZakat({
    ...(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, num(v)])) as Record<keyof Fields, number>),
    nisabStandard: standard,
  });

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => setF((prev) => ({ ...prev, [k]: e.target.value }));
  const field = (k: keyof Fields, label: string, hint?: string, unit = symbol) => (
    <div className="space-y-1.5">
      <Label htmlFor={`z-${k}`}>{label} ({unit})</Label>
      <Input id={`z-${k}`} inputMode="decimal" value={f[k]} onChange={set(k)} placeholder="0" />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  function refill() {
    setF((prev) => ({
      ...prev,
      cash: str(fromAccounts.cash),
      savings: str(fromAccounts.savings),
      investments: str(fromAccounts.investments),
      debtsDue: str(fromAccounts.cardDebt),
    }));
  }

  return (
    <div>
      <PageHeader
        title={t("Zakat calculator")}
        subtitle={t("Estimate the zakat on your wealth using your Sanchay balances.")}
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={refill}>
            <RefreshCw className="size-4" />
            {t("Refill from accounts")}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Money and savings")}</CardTitle>
              <CardDescription>{t("Filled in from your account balances. Adjust anything that isn't right.")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {field("cash", t("Cash, bank and wallets"))}
              {field("savings", t("Savings, FDR and DPS"))}
              {field("investments", t("Shares and investments"), t("Market value of shares or funds."))}
              {field("receivables", t("Money owed to you"), t("Loans you expect to get back."))}
              {field("businessAssets", t("Business assets"), t("Stock for sale and business cash."))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Gold and silver")}</CardTitle>
              <CardDescription>{t("Enter today's local price per gram. Prices are needed for the nisab too.")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {field("goldGrams", t("Gold you own"), undefined, t("grams"))}
              {field("goldPricePerGram", t("Gold price per gram"))}
              {field("silverGrams", t("Silver you own"), undefined, t("grams"))}
              {field("silverPricePerGram", t("Silver price per gram"))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Deductions")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {field("debtsDue", t("Debts due now"), t("Credit card balances, bills and instalments due now. Filled from your card accounts."))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className={cn(result.eligible && "border-primary/50")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="size-4 text-primary" />
                {t("Your zakat")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
                {(["silver", "gold"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStandard(s)}
                    className={cn("rounded-md px-2 py-1.5 font-medium transition-colors", standard === s ? "bg-background shadow-sm" : "text-muted-foreground")}
                  >
                    {s === "silver" ? t("Silver nisab") : t("Gold nisab")}
                  </button>
                ))}
              </div>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">{t("Total assets")}</dt><dd className="tabular-nums">{formatCurrency(result.totalAssets)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t("Less debts due now")}</dt><dd className="tabular-nums">−{formatCurrency(num(f.debtsDue))}</dd></div>
                <div className="flex justify-between font-medium"><dt>{t("Zakatable wealth")}</dt><dd className="tabular-nums">{formatCurrency(result.netWealth)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t("Nisab ({g} g of {metal})", { g: standard === "gold" ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS, metal: t(standard) })}</dt><dd className="tabular-nums">{result.missingPrice ? "—" : formatCurrency(result.nisab)}</dd></div>
              </dl>

              <div className="rounded-xl bg-primary/10 p-4 text-center">
                {result.missingPrice ? (
                  <p className="text-sm">{t("Enter the {metal} price per gram to check the nisab.", { metal: t(standard) })}</p>
                ) : result.eligible ? (
                  <>
                    <p className="text-xs text-muted-foreground">{t("Zakat due ({rate}%)", { rate: ZAKAT_RATE * 100 })}</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums">{formatCurrency(result.zakatDue, { showDecimals: true })}</p>
                  </>
                ) : (
                  <p className="text-sm">{t("Your wealth is below the nisab, so no zakat is due.")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <p className="flex gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            {t("Zakat is due on wealth held for a full lunar year. This is an estimate; scholars differ on some details, so please confirm with a scholar you trust.")}
          </p>
        </div>
      </div>
    </div>
  );
}
