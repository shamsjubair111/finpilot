"use client";

import { getCurrencySymbol } from "@/lib/currency";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { useFinance } from "@/components/providers/finance-provider";
import { ACCOUNT_TYPE_META, isLiability } from "@/lib/accounts";
import type { Account, AccountType } from "@/types/finance";
import { cn } from "cn";
import { t as tr } from "@/lib/i18n";

const TYPES = Object.keys(ACCOUNT_TYPE_META) as AccountType[];

export function AccountFormDialog({
  account,
  open,
  onOpenChange,
}: {
  account?: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addAccount, updateAccount } = useFinance();
  const isEdit = !!account;
  const [type, setType] = React.useState<AccountType>("bank");
  const [name, setName] = React.useState("");
  const [institution, setInstitution] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [openingBalance, setOpeningBalance] = React.useState("");
  const [creditLimit, setCreditLimit] = React.useState("");
  const [interestRate, setInterestRate] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [nameTouched, setNameTouched] = React.useState(false);

  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setType(account?.type ?? "bank");
    setName(account?.name ?? "");
    setNameTouched(!!account);
    setInstitution(account?.institution ?? "");
    setAccountNumber(account?.accountNumber ?? "");
    setOpeningBalance(account ? String(account.openingBalance) : "");
    setCreditLimit(account?.creditLimit ? String(account.creditLimit) : "");
    setInterestRate(account?.interestRate ? String(account.interestRate) : "");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const meta = ACCOUNT_TYPE_META[type];
  const liability = isLiability(type);
  const isWallet = meta.group === "Wallets";
  const isValid = name.trim().length > 0;

  function pickType(t: AccountType) {
    setType(t);
    if (!nameTouched) setName(ACCOUNT_TYPE_META[t].group === "Wallets" || t === "cash" ? ACCOUNT_TYPE_META[t].label : "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setPending(true);
    const data = {
      type,
      name: name.trim(),
      institution: institution.trim() || null,
      accountNumber: accountNumber.trim() || null,
      openingBalance: Number(openingBalance) || 0,
      creditLimit: type === "credit_card" && creditLimit ? Number(creditLimit) : null,
      interestRate: liability && interestRate ? Number(interestRate) : null,
      color: meta.color,
    };
    const ok = isEdit ? await updateAccount(account!.id, data) : await addAccount(data);
    setPending(false);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? tr("Edit account") : tr("Add account")}</DialogTitle>
          <DialogDescription>
            {tr("Bank accounts, mobile wallets, cash, credit cards and loans — record transactions against any of them.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {TYPES.map((t) => {
              const m = ACCOUNT_TYPE_META[t];
              const active = t === type;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => pickType(t)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-[11px] font-medium transition-all",
                    active ? "border-transparent text-white shadow-card" : "border-border hover:-translate-y-0.5 hover:bg-muted/50"
                  )}
                  style={active ? { background: `linear-gradient(135deg, ${m.color}, color-mix(in oklch, ${m.color}, black 30%))` } : undefined}
                >
                  <DynamicIcon name={m.icon} className="size-4" style={active ? undefined : { color: m.color }} />
                  <span className="leading-tight">{tr(m.label).split(" /")[0].split(" (")[0]}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="acc-name">{tr("Account name")}</Label>
              <Input
                id="acc-name"
                required
                placeholder={type === "bank" ? tr("e.g. DBBL Savings") : type === "credit_card" ? tr("e.g. City Bank Amex") : type === "loan" ? tr("e.g. Car loan") : tr("e.g. Personal")}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameTouched(true);
                }}
              />
            </div>
            {!isWallet && type !== "cash" && (
              <div className="space-y-1.5">
                <Label htmlFor="acc-inst">{type === "loan" ? tr("Lender") : tr("Bank / institution")} {tr("(optional)")}</Label>
                <Input id="acc-inst" placeholder={type === "loan" ? tr("e.g. BRAC Bank") : tr("e.g. Dutch-Bangla Bank")} value={institution} onChange={(e) => setInstitution(e.target.value)} />
              </div>
            )}
            {type !== "cash" && (
              <div className={cn("space-y-1.5", isWallet && "sm:col-span-2")}>
                <Label htmlFor="acc-num">{isWallet ? tr("Wallet number") : type === "credit_card" ? tr("Card number") : tr("Account number")} {tr("(optional)")}</Label>
                <Input id="acc-num" inputMode="numeric" placeholder={isWallet ? tr("01XXXXXXXXX") : tr("Only the last 4 digits are shown")} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="acc-open">{liability ? `${tr("Amount currently owed")} (${getCurrencySymbol()})` : `${tr("Current balance")} (${getCurrencySymbol()})`}</Label>
              <Input id="acc-open" type="number" step="any" inputMode="decimal" placeholder="0" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                {liability ? tr("Spending on it increases what you owe; payments reduce it.") : tr("Balance before the transactions you record here.")}
              </p>
            </div>
            {type === "credit_card" && (
              <div className="space-y-1.5">
                <Label htmlFor="acc-limit">{`${tr("Credit limit")} (${getCurrencySymbol()})`}</Label>
                <Input id="acc-limit" type="number" min={0} step="any" inputMode="decimal" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
              </div>
            )}
            {liability && (
              <div className="space-y-1.5">
                <Label htmlFor="acc-rate">{tr("Interest rate (% per year, optional)")}</Label>
                <Input id="acc-rate" type="number" min={0} max={100} step="any" inputMode="decimal" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tr("Cancel")}
            </Button>
            <SubmitButton pending={pending} disabled={!isValid}>{isEdit ? tr("Save changes") : tr("Add account")}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
