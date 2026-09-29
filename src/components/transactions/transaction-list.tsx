"use client";

import * as React from "react";
import { formatDate } from "@/lib/format-date";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Paperclip, Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/currency";
import { CATEGORY_ICON_MAP, PAYMENT_METHODS } from "@/lib/constants";
import type { Transaction } from "@/types/finance";
import { RowActions } from "@/components/shared/row-actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { useFinance } from "@/components/providers/finance-provider";
import { t as tr } from "@/lib/i18n";

function paymentLabel(method: string) {
  return tr(PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method);
}

export function TransactionList({ transactions, emptyAction }: { transactions: Transaction[]; emptyAction?: React.ReactNode }) {
  const { deleteTransaction, accounts } = useFinance();
  const accountName = (id?: string | null) => accounts.find((a) => a.id === id)?.name;
  const where = (t: Transaction) =>
    t.type === "transfer"
      ? `${accountName(t.accountId) ?? "?"} → ${accountName(t.toAccountId) ?? "?"}`
      : accountName(t.accountId) ?? paymentLabel(t.paymentMethod);
  const tone = (t: Transaction) =>
    t.type === "income" ? "bg-success/10 text-success" : t.type === "transfer" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground";
  const sign = (t: Transaction) => (t.type === "income" ? "+" : t.type === "expense" ? "-" : "");
  const amountTone = (t: Transaction) => (t.type === "income" ? "text-success" : t.type === "transfer" ? "text-primary" : "text-foreground");
  const [editing, setEditing] = React.useState<Transaction | null>(null);
  const [deleting, setDeleting] = React.useState<Transaction | null>(null);

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={tr("No transactions found")}
        description={tr("Try adjusting your filters, or add a new transaction to get started.")}
        action={emptyAction}
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{tr("Transaction")}</TableHead>
              <TableHead>{tr("Category")}</TableHead>
              <TableHead>{tr("Date")}</TableHead>
              <TableHead>{tr("Account")}</TableHead>
              <TableHead className="text-right">{tr("Amount")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => {
              const iconName = CATEGORY_ICON_MAP[t.category] ?? "Receipt";
              return (
                <TableRow key={t.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${tone(t)}`}
                      >
                        <DynamicIcon name={iconName} className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 truncate text-sm font-medium">
                          {t.title}
                          {t.hasReceipt && <Paperclip className="size-3 shrink-0 text-muted-foreground" aria-label={tr("Receipt")} />}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{t.merchant || paymentLabel(t.paymentMethod)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {tr(t.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(t.date, "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                    {where(t)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm font-semibold tabular-nums ${amountTone(t)}`}>
                      {sign(t)}
                      {formatCurrency(t.amount)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions label={t.title} onEdit={() => setEditing(t)} onDelete={() => setDeleting(t)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2.5 md:hidden">
        {transactions.map((t) => {
          const isIncome = t.type === "income";
          const iconName = CATEGORY_ICON_MAP[t.category] ?? "Receipt";
          return (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-3.5 transition-shadow hover:shadow-card">
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${tone(t)}`}
                >
                  <DynamicIcon name={iconName} className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex items-center gap-1 truncate text-sm font-medium">
                          {t.title}
                          {t.hasReceipt && <Paperclip className="size-3 shrink-0 text-muted-foreground" aria-label={tr("Receipt")} />}
                        </p>
                    <span className={`shrink-0 text-sm font-semibold tabular-nums ${amountTone(t)}`}>
                      {sign(t)}
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{t.merchant || paymentLabel(t.paymentMethod)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="font-normal">
                      {tr(t.category)}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {t.type === "transfer" ? <ArrowLeftRight className="size-3" /> : isIncome ? <ArrowUpRight className="size-3" /> : <ArrowDownLeft className="size-3" />}
                      {formatDate(t.date, "MMM d")}
                    </span>
                    <span className="min-w-0 truncate text-xs text-muted-foreground">· {where(t)}</span>
                    <span className="ml-auto">
                      <RowActions label={t.title} onEdit={() => setEditing(t)} onDelete={() => setDeleting(t)} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <TransactionFormDialog transaction={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={tr("Delete transaction?")}
        description={tr("\"{name}\" will be permanently removed and your budgets will update.", { name: deleting?.title ?? "" })}
        onConfirm={() => deleteTransaction(deleting!.id)}
      />
    </>
  );
}
