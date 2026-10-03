"use client";

import * as React from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/components/providers/finance-provider";
import { t } from "@/lib/i18n";
import type { Currency } from "@/types/finance";

/** Rates for foreign-currency accounts; shown only once such an account exists. */
export function ExchangeRatesCard() {
  const { accounts, user, ledger, updateUser } = useFinance();
  const currencies = [...new Set(accounts.map((a) => a.currency).filter((c): c is Currency => !!c && c !== user.currency))];
  const saved = user.exchangeRates ?? {};
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState(false);
  if (!currencies.length) return null;
  const isOwner = ledger.ownerId === user.id;

  const value = (c: Currency) => values[c] ?? (saved[c] ? String(saved[c]) : "");
  const valid = currencies.every((c) => !value(c) || Number(value(c)) > 0);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const rates = { ...saved };
    for (const c of currencies) if (Number(value(c)) > 0) rates[c] = Number(value(c));
    if (await updateUser({ exchangeRates: rates }, "Exchange rates saved")) setValues({});
    setPending(false);
  }

  return (
    <Card id="exchange-rates" className="animate-in-up scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="size-4 text-muted-foreground" /> {t("Exchange rates")}
        </CardTitle>
        <CardDescription>
          {t("Used to count foreign-currency accounts in your totals and to suggest amounts when you record transactions. Update them when the rate changes.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-3">
          {currencies.map((c) => (
            <div key={c} className="flex items-center gap-3">
              <Label htmlFor={`rate-${c}`} className="w-24 shrink-0">1 {c} =</Label>
              <Input id={`rate-${c}`} type="number" min={0} step="any" value={value(c)} onChange={(e) => setValues({ ...values, [c]: e.target.value })} disabled={!isOwner} className="max-w-40" />
              <span className="text-sm text-muted-foreground">{user.currency}</span>
            </div>
          ))}
          {isOwner ? (
            <Button type="submit" disabled={pending || !valid || !Object.keys(values).length}>{t("Save rates")}</Button>
          ) : (
            <p className="text-xs text-muted-foreground">{t("Only the household owner can change these settings.")}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
