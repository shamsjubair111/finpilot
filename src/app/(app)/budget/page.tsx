"use client";

import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { BudgetSummaryCards } from "@/components/budget/budget-summary-cards";
import { BudgetCategoryCard } from "@/components/budget/budget-category-card";
import { BudgetEditDialog } from "@/components/budget/budget-edit-dialog";
import { BudgetRecommendations } from "@/components/budget/budget-recommendations";
import { useFinance } from "@/components/providers/finance-provider";
import { formatDate } from "@/lib/format-date";
import { getBudgetTotals } from "@/lib/calculations/budget";
import type { BudgetCategory } from "@/types/finance";
import { t } from "@/lib/i18n";

export default function BudgetPage() {
  const { budgetCategories, deleteBudgetCategory, selectedMonth } = useFinance();
  const [editing, setEditing] = useState<BudgetCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<BudgetCategory | null>(null);
  const totals = getBudgetTotals(budgetCategories);

  const addButton = (
    <Button size="sm" className="gap-1.5" onClick={() => setCreating(true)}>
      <Plus className="size-4" />
      {t("Add Budget")}
    </Button>
  );

  return (
    <div>
      <PageHeader
        editOnly
        title={t("Budget")}
        subtitle={t("Plan and track your spending by category for {month}.", { month: formatDate(selectedMonth, "MMMM yyyy") })}
        actions={budgetCategories.length > 0 && addButton}
      />

      {budgetCategories.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={t("No budgets yet")}
          description={t("Create a budget for categories like Food or Transport. Spending is tracked automatically from your expenses.")}
          action={addButton}
        />
      ) : (
        <div className="space-y-6">
          <BudgetSummaryCards
            totalBudgeted={totals.totalBudgeted}
            totalSpent={totals.totalSpent}
            remaining={totals.remaining}
            utilization={totals.utilization}
          />

          <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {budgetCategories.map((c) => (
              <BudgetCategoryCard key={c.id} category={c} onEdit={() => setEditing(c)} onDelete={() => setDeleting(c)} />
            ))}
          </div>

          <BudgetRecommendations categories={budgetCategories} />
        </div>
      )}

      <BudgetEditDialog category={null} open={creating} onOpenChange={setCreating} />
      <BudgetEditDialog category={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("Delete {name} budget?", { name: t(deleting?.category ?? "") })}
        description={t("Your transactions stay untouched — only the monthly limit is removed.")}
        onConfirm={() => deleteBudgetCategory(deleting!.id)}
      />
    </div>
  );
}
