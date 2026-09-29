"use client";

import { getCurrencySymbol } from "@/lib/currency";

import * as React from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { useFinance } from "@/components/providers/finance-provider";
import { CATEGORY_ICON_MAP } from "@/lib/constants";
import { categoryColor } from "@/lib/chart-colors";
import type { BudgetCategory, ExpenseCategory } from "@/types/finance";
import { t } from "@/lib/i18n";

export function BudgetEditDialog({
  category,
  open,
  onOpenChange,
}: {
  category: BudgetCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { budgetCategories, addBudgetCategory, updateBudgetCategory, categoriesFor } = useFinance();
  const isEdit = !!category;
  const [name, setName] = React.useState<ExpenseCategory | "">("");
  const [budgeted, setBudgeted] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const available = categoriesFor("expense").filter((c) => c === category?.category || !budgetCategories.some((b) => b.category === c));

  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setName(category?.category ?? "");
    setBudgeted(category ? String(category.budgeted) : "");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const isValid = name && Number(budgeted) > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setPending(true);
    const ok = isEdit
      ? await updateBudgetCategory(category!.id, { budgeted: Number(budgeted) })
      : await addBudgetCategory({
          category: name as ExpenseCategory,
          budgeted: Number(budgeted),
          icon: CATEGORY_ICON_MAP[name] ?? "Wallet",
          color: categoryColor(name),
        });
    setPending(false);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("Edit {name} Budget", { name: t(category.category) }) : t("New Budget Category")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("Update your monthly allocation for this category.") : t("Set a monthly spending limit for a category.")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="budget-category">{t("Category")}</Label>
              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("Every category already has a budget.")}</p>
              ) : (
                <Select value={name} onValueChange={(v) => setName(v as ExpenseCategory)}>
                  <SelectTrigger id="budget-category" className="w-full">
                    <SelectValue placeholder={t("Choose a category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((c) => (
                      <SelectItem key={c} value={c}>
                        <DynamicIcon name={CATEGORY_ICON_MAP[c]} className="size-4" style={{ color: categoryColor(c) }} />
                        {t(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="budget-amount">{`${t("Monthly Budget")} (${getCurrencySymbol()})`}</Label>
            <Input
              id="budget-amount"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={budgeted}
              onChange={(e) => setBudgeted(e.target.value)}
              autoFocus={isEdit}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("Cancel")}
            </Button>
            <SubmitButton pending={pending} disabled={!isValid}>{isEdit ? t("Save changes") : t("Create budget")}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
