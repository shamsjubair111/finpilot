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

function paymentLabel(method: string) {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No transactions found"
        description="Try adjusting your filters, or add a new transaction to get started."
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => {
              const isIncome = t.type === "income";
              const iconName = CATEGORY_ICON_MAP[t.category] ?? "Receipt";
              return (
                <TableRow key={t.id}>
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
                        <p className="truncate text-xs text-muted-foreground">{t.merchant}</p>
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
            <div key={t.id} className="rounded-xl border border-border bg-card p-3.5">
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
                  <p className="truncate text-xs text-muted-foreground">{t.merchant}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="font-normal">
                      {t.category}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {isIncome ? <ArrowUpRight className="size-3" /> : <ArrowDownLeft className="size-3" />}
                      {format(new Date(t.date), "MMM d")}
                    </span>
                    <span className="text-xs text-muted-foreground">· {paymentLabel(t.paymentMethod)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
