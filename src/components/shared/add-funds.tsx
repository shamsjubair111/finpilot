"use client";

import * as React from "react";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/shared/submit-button";
import { getCurrencySymbol } from "@/lib/currency";
import { t } from "@/lib/i18n";

export function AddFunds({ onAdd, label: labelProp }: { onAdd: (amount: number) => Promise<boolean>; label?: string }) {
  const label = labelProp ?? t("Add funds");
  const [amount, setAmount] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!(value > 0)) return;
    setPending(true);
    if (await onAdd(value)) setAmount("");
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{getCurrencySymbol()}</span>
        <Input
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          placeholder={t("Amount")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="pl-9"
          aria-label={label}
        />
      </div>
      <SubmitButton pending={pending} disabled={!(Number(amount) > 0)}>
        {!pending && <PlusCircle className="size-4" />}
        {label}
      </SubmitButton>
    </form>
  );
}
