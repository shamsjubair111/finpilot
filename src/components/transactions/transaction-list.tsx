"use client";

import * as React from "react";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
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

function paymentLabel(method: string) {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

export function TransactionList({ transactions, emptyAction }: { transactions: Transaction[]; emptyAction?: React.ReactNode }) {
  const { deleteTransaction } = useFinance();
  const [editing, setEditing] = React.useState<Transaction | null>(null);
  const [deleting, setDeleting] = React.useState<Transaction | null>(null);

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No transactions found"
        description="Try adjusting your filters, or add a new transaction to get started."
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
              <TableHead>Transaction</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => {
              const isIncome = t.type === "income";
              const iconName = CATEGORY_ICON_MAP[t.category] ?? "Receipt";
              return (
                <TableRow key={t.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                          isIncome ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <DynamicIcon name={iconName} className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{t.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{t.merchant || paymentLabel(t.paymentMethod)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {t.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(t.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {paymentLabel(t.paymentMethod)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        isIncome ? "text-success" : "text-foreground"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
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
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                    isIncome ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <DynamicIcon name={iconName} className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        isIncome ? "text-success" : "text-foreground"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{t.merchant || paymentLabel(t.paymentMethod)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="font-normal">
                      {t.category}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {isIncome ? <ArrowUpRight className="size-3" /> : <ArrowDownLeft className="size-3" />}
                      {format(new Date(t.date), "MMM d")}
                    </span>
                    <span className="text-xs text-muted-foreground">· {paymentLabel(t.paymentMethod)}</span>
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
        title="Delete transaction?"
        description={`"${deleting?.title}" will be permanently removed and your budgets will update.`}
        onConfirm={() => deleteTransaction(deleting!.id)}
      />
    </>
  );
}
