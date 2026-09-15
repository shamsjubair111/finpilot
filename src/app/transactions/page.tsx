"use client";

import { useMemo, useState } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TransactionFilters,
  type TransactionFilterState,
} from "@/components/transactions/transaction-filters";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { useFinance } from "@/components/providers/finance-provider";
import { formatCurrency } from "@/lib/currency";

export default function TransactionsPage() {
  const { transactions } = useFinance();
  const [filters, setFilters] = useState<TransactionFilterState>({
    search: "",
    category: "all",
    type: "all",
  });

  const filtered = useMemo(() => {
    return [...transactions]
      .filter((t) => {
        if (filters.type !== "all" && t.type !== filters.type) return false;
        if (filters.category !== "all" && t.category !== filters.category) return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          if (!t.title.toLowerCase().includes(q) && !t.merchant.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filters]);

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Every income and expense, all in one place."
        actions={
          <TransactionFormDialog
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                Add Transaction
              </Button>
            }
          />
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Wallet className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Showing</p>
              <p className="text-lg font-semibold tabular-nums">{filtered.length} transactions</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-success/10 text-success">
              <ArrowUpRight className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Income</p>
              <p className="text-lg font-semibold tabular-nums text-success">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <ArrowDownRight className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-5">
          <TransactionFilters filters={filters} onChange={setFilters} />
          <TransactionList transactions={filtered} />
        </CardContent>
      </Card>
    </div>
  );
}
