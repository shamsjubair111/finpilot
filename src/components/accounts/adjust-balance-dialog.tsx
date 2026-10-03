"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { useFinance } from "@/components/providers/finance-provider";
import { isLiability } from "@/lib/accounts";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { t } from "@/lib/i18n";
import type { Account } from "@/types/finance";

/**
 * Sets an account to the balance the bank or wallet app shows. The difference goes into the opening
 * balance, so no fake income or expense appears in budgets and reports.
 */
export function AdjustBalanceDialog({ account, onClose }: { account: Account | null; onClose: () => void }) {
  const { accountBalances, updateAccount } = useFinance();
  const current = account ? accountBalances.get(account.id) ?? 0 : 0;
  const [value, setValue] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [lastId, setLastId] = React.useState<string | null>(null);
  if (account && account.id !== lastId) {
    setLastId(account.id);
    setValue(String(Math.round(current * 100) / 100));
  }

  const target = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(target);
  const diff = valid ? target - current : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!account || !valid) return;
    setPending(true);
    // Assets: balance = opening + flows. Liabilities: balance = opening − flows. Either way, shift opening by the difference.
    const ok = await updateAccount(account.id, { openingBalance: Math.round((account.openingBalance + diff) * 100) / 100 });
    setPending(false);
    if (ok) {
      setLastId(null);
      onClose();
    }
  }

  return (
    <Dialog open={!!account} onOpenChange={(o) => !o && !pending && (setLastId(null), onClose())}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("Update balance")}</DialogTitle>
            <DialogDescription>
              {account && isLiability(account.type)
                ? t("Enter how much you owe on {name} right now, as shown by your bank.", { name: account.name })
                : t("Enter the balance {name} shows right now in your bank or wallet app.", { name: account?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="adj-balance">{t("Actual balance")} ({getCurrencySymbol(account?.currency ?? undefined)})</Label>
            <Input id="adj-balance" type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
            <p className="text-xs text-muted-foreground">
              {t("Sanchay shows {amount}.", { amount: formatCurrency(current, { showDecimals: true, currency: account?.currency ?? undefined }) })}
              {valid && Math.abs(diff) >= 0.01 && ` ${t("Difference: {amount}.", { amount: formatCurrency(diff, { showDecimals: true, signDisplay: "always", currency: account?.currency ?? undefined }) })}`}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>{t("Cancel")}</Button>
            <SubmitButton pending={pending} disabled={!valid || Math.abs(diff) < 0.01}>{t("Save")}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
