"use client";

import { Suspense, useMemo, useState } from "react";
import { categoryParts } from "@/lib/splits";
import { useSearchParams } from "next/navigation";
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
import { t as tr } from "@/lib/i18n";

export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionsView />
    </Suspense>
  );
}

function TransactionsView() {
  const params = useSearchParams();
  const { transactions } = useFinance();
  const [filters, setFilters] = useState<TransactionFilterState>({
    search: "",
    category: "all",
    type: "all",
    account: params.get("account") ?? "all",
  });

  const filtered = useMemo(() => {
    return [...transactions]
      .filter((t) => {
        if (filters.type !== "all" && t.type !== filters.type) return false;
        if (filters.category !== "all" && !categoryParts(t).some((p) => p.category === filters.category)) return false;
        if (filters.account !== "all" && t.accountId !== filters.account && t.toAccountId !== filters.account) return false;
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
        editOnly
        title={tr("Transactions")}
        subtitle={tr("Every income and expense, all in one place.")}
        actions={
          <TransactionFormDialog
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                {tr("Add Transaction")}
              </Button>
            }
          />
        }
      />

      <div className="stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="card-hover p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Wallet className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{tr("Showing")}</p>
              <p className="text-lg font-semibold tabular-nums">{tr("{count} transactions", { count: filtered.length })}</p>
            </div>
          </div>
        </Card>
        <Card className="card-hover p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-success/10 text-success">
              <ArrowUpRight className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{tr("Total Income")}</p>
              <p className="text-lg font-semibold tabular-nums text-success">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </Card>
        <Card className="card-hover p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <ArrowDownRight className="size-[18px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{tr("Total Expenses")}</p>
              <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-5">
          <TransactionFilters filters={filters} onChange={setFilters} />
          <TransactionList
            transactions={filtered}
            emptyAction={
              transactions.length === 0 ? (
                <TransactionFormDialog trigger={<Button size="sm" className="gap-1.5"><Plus className="size-4" />{tr("Add your first transaction")}</Button>} />
              ) : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
