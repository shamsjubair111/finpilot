"use client";

import Link from "next/link";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { Scale } from "lucide-react";
import { RowActions } from "@/components/shared/row-actions";
import { ACCOUNT_TYPE_META, isLiability, maskNumber } from "@/lib/accounts";
import { formatCurrency } from "@/lib/currency";
import type { Account } from "@/types/finance";
import { t } from "@/lib/i18n";

export function AccountCard({
  account,
  balance,
  onEdit,
  onDelete,
  onAdjust,
}: {
  account: Account;
  balance: number;
  onEdit: () => void;
  onDelete: () => void;
  onAdjust?: () => void;
}) {
  const meta = ACCOUNT_TYPE_META[account.type];
  const liability = isLiability(account.type);
  const utilization = account.type === "credit_card" && account.creditLimit ? Math.min(100, Math.round((balance / account.creditLimit) * 100)) : null;

  return (
    <div
      className="card-hover group relative flex aspect-[1.7/1] min-h-44 flex-col justify-between overflow-hidden rounded-3xl p-5 text-white shadow-card"
      style={{ background: `linear-gradient(135deg, ${meta.color}, color-mix(in oklch, ${meta.color}, black 45%))` }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 size-44 rounded-full bg-black/20 blur-2xl" />
      <Link href={`/transactions?account=${account.id}`} className="absolute inset-0 z-0" aria-label={t("View {name} transactions", { name: account.name })} />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <DynamicIcon name={meta.icon} className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{account.name}</p>
            <p className="truncate text-xs text-white/70">{account.institution || t(meta.label)}</p>
          </div>
        </div>
        <div className="[&_button]:text-white [&_button:hover]:bg-white/20">
          <RowActions
            label={account.name}
            onEdit={onEdit}
            onDelete={onDelete}
            extra={onAdjust ? [{ label: t("Update balance"), icon: Scale, onSelect: onAdjust }] : []}
          />
        </div>
      </div>

      <div className="relative z-0 pointer-events-none">
        <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">{liability ? t("Outstanding") : t("Balance")}</p>
        <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-[1.7rem]">{formatCurrency(balance)}</p>
        {utilization !== null ? (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(0, utilization)}%` }} />
            </div>
            <p className="text-[11px] text-white/70">
              {t("{pct}% of {limit} limit used", { pct: utilization, limit: formatCurrency(account.creditLimit!, { compact: true }) })}
            </p>
          </div>
        ) : (
          <p className="mt-1 font-mono text-xs tracking-widest text-white/60">
            {maskNumber(account.accountNumber)}
            {account.interestRate ? `  ·  ${t("{rate}% APR", { rate: account.interestRate })}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
