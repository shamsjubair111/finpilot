"use client";

import * as React from "react";
import { formatDate } from "@/lib/format-date";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Paperclip, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { deleteTransaction, accounts, readOnly, bulkDeleteTransactions, bulkCategorize, categoriesFor } = useFinance();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = React.useState(false);
  // Selection only covers what's currently listed, so filtering never acts on hidden rows.
  const visibleSelected = transactions.filter((x) => selected.has(x.id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = transactions.length > 0 && visibleSelected.length === transactions.length;
  const selectedTypes = new Set(visibleSelected.map((x) => x.type).filter((x) => x !== "transfer"));
  const recategorizeType = selectedTypes.size === 1 ? ([...selectedTypes][0] as "income" | "expense") : null;
  const checkbox = (id: string, label: string) =>
    !readOnly && (
      <input
        type="checkbox"
        className="size-4 shrink-0 accent-[var(--primary)]"
        checked={selected.has(id)}
        onChange={() => toggle(id)}
        aria-label={tr("Select {name}", { name: label })}
      />
    );
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
      {visibleSelected.length > 0 && (
        <div className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl border bg-card/95 p-2.5 shadow-card backdrop-blur">
          <span className="px-1 text-sm font-medium">{tr("{n} selected", { n: visibleSelected.length })}</span>
          {recategorizeType ? (
            <Select
              value=""
              onValueChange={async (c) => {
                if (await bulkCategorize(visibleSelected.map((x) => x.id), c, recategorizeType)) setSelected(new Set());
              }}
            >
              <SelectTrigger className="h-8 w-44"><SelectValue placeholder={tr("Change category…")} /></SelectTrigger>
              <SelectContent>
                {categoriesFor(recategorizeType).map((c) => (
                  <SelectItem key={c} value={c}>{tr(c)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-muted-foreground">{tr("Select only income or only expenses to change the category.")}</span>
          )}
          <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => setBulkDeleting(true)}>
            <Trash2 className="size-3.5" />
            {tr("Delete")}
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>{tr("Clear")}</Button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {!readOnly && (
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(transactions.map((x) => x.id)))}
                    aria-label={tr("Select all")}
                  />
                </TableHead>
              )}
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
                <TableRow key={t.id} className="group" data-state={selected.has(t.id) ? "selected" : undefined}>
                  {!readOnly && <TableCell>{checkbox(t.id, t.title)}</TableCell>}
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
                {!readOnly && <div className="pt-2.5">{checkbox(t.id, t.title)}</div>}
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
      <ConfirmDialog
        open={bulkDeleting}
        onOpenChange={setBulkDeleting}
        title={tr("Delete {n} transactions?", { n: visibleSelected.length })}
        description={tr("They will be permanently removed and your budgets will update.")}
        onConfirm={async () => {
          const ok = await bulkDeleteTransactions(visibleSelected.map((x) => x.id));
          if (ok) setSelected(new Set());
          return ok;
        }}
      />
    </>
  );
}
