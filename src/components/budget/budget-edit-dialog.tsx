"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/components/providers/finance-provider";
import type { BudgetCategory } from "@/types/finance";

export function BudgetEditDialog({
  category,
  open,
  onOpenChange,
}: {
  category: BudgetCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateBudgetCategory } = useFinance();
  const [budgeted, setBudgeted] = React.useState("");
  const [loadedCategoryId, setLoadedCategoryId] = React.useState<string | null>(null);

  if (category && category.id !== loadedCategoryId) {
    setLoadedCategoryId(category.id);
    setBudgeted(String(category.budgeted));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !budgeted || Number(budgeted) <= 0) return;
    updateBudgetCategory(category.id, { budgeted: Number(budgeted) });
    toast.success("Budget updated", { description: `${category.category} set to ৳${Number(budgeted).toLocaleString()}` });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit {category?.category} Budget</DialogTitle>
          <DialogDescription>Update your monthly allocation for this category.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="budget-amount">Monthly Budget (৳)</Label>
            <Input
              id="budget-amount"
              type="number"
              min={0}
              value={budgeted}
              onChange={(e) => setBudgeted(e.target.value)}
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
