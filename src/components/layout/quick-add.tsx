"use client";

import * as React from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, Target, ListChecks, CalendarClock, Wallet, ArrowLeftRight, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { PurchaseFormDialog } from "@/components/wishlist/purchase-form-dialog";
import { CommitmentFormDialog } from "@/components/commitments/commitment-form-dialog";
import { BudgetEditDialog } from "@/components/budget/budget-edit-dialog";
import { t } from "@/lib/i18n";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

type QuickAddMode = "expense" | "income" | "goal" | "purchase" | "commitment" | "budget" | "transfer" | "account" | null;

export function QuickAdd() {
  const [mode, setMode] = React.useState<QuickAddMode>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            className="bg-gradient-brand glow-primary gap-1.5 text-white hover:brightness-110"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t("Quick Add")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onSelect={() => setMode("expense")} className="gap-2">
            <ArrowDownCircle className="size-4 text-destructive" />
            {t("Add Expense")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMode("income")} className="gap-2">
            <ArrowUpCircle className="size-4 text-success" />
            {t("Add Income")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMode("transfer")} className="gap-2">
            <ArrowLeftRight className="size-4 text-primary" />
            {t("Transfer / Pay Card or Loan")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setMode("goal")} className="gap-2">
            <Target className="size-4 text-primary" />
            {t("Add Goal")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMode("purchase")} className="gap-2">
            <ListChecks className="size-4 text-primary" />
            {t("Add Wishlist Item")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMode("budget")} className="gap-2">
            <Wallet className="size-4 text-primary" />
            {t("Add Budget")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMode("commitment")} className="gap-2">
            <CalendarClock className="size-4 text-primary" />
            {t("Add Commitment")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setMode("account")} className="gap-2">
            <Landmark className="size-4 text-primary" />
            {t("Add Account")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TransactionFormDialog
        defaultType="expense"
        open={mode === "expense"}
        onOpenChange={(o) => setMode(o ? "expense" : null)}
      />
      <TransactionFormDialog
        defaultType="income"
        open={mode === "income"}
        onOpenChange={(o) => setMode(o ? "income" : null)}
      />
      <GoalFormDialog open={mode === "goal"} onOpenChange={(o) => setMode(o ? "goal" : null)} />
      <PurchaseFormDialog
        open={mode === "purchase"}
        onOpenChange={(o) => setMode(o ? "purchase" : null)}
      />
      <TransactionFormDialog defaultType="transfer" open={mode === "transfer"} onOpenChange={(o) => setMode(o ? "transfer" : null)} />
      <AccountFormDialog open={mode === "account"} onOpenChange={(o) => setMode(o ? "account" : null)} />
      <CommitmentFormDialog open={mode === "commitment"} onOpenChange={(o) => setMode(o ? "commitment" : null)} />
      <BudgetEditDialog category={null} open={mode === "budget"} onOpenChange={(o) => setMode(o ? "budget" : null)} />
    </>
  );
}
