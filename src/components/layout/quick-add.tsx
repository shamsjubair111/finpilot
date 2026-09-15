"use client";

import * as React from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, Target, ListChecks } from "lucide-react";
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

type QuickAddMode = "expense" | "income" | "goal" | "purchase" | null;

export function QuickAdd() {
  const [mode, setMode] = React.useState<QuickAddMode>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-to-b from-[color-mix(in_oklch,var(--primary),white_10%)] to-primary shadow-[0_1px_1px_rgba(255,255,255,0.15)_inset,0_4px_12px_-2px_color-mix(in_oklch,var(--primary),transparent_55%)] hover:brightness-110"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Quick Add</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => setMode("expense")} className="gap-2">
            <ArrowDownCircle className="size-4 text-destructive" />
            Add Expense
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMode("income")} className="gap-2">
            <ArrowUpCircle className="size-4 text-success" />
            Add Income
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMode("goal")} className="gap-2">
            <Target className="size-4 text-primary" />
            Add Goal
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMode("purchase")} className="gap-2">
            <ListChecks className="size-4 text-primary" />
            Add Purchase
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
    </>
  );
}
