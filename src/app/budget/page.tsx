"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { BudgetSummaryCards } from "@/components/budget/budget-summary-cards";
import { BudgetCategoryCard } from "@/components/budget/budget-category-card";
import { BudgetEditDialog } from "@/components/budget/budget-edit-dialog";
import { BudgetRecommendations } from "@/components/budget/budget-recommendations";
import { useFinance } from "@/components/providers/finance-provider";
import { getBudgetTotals } from "@/lib/calculations/budget";
import type { BudgetCategory } from "@/types/finance";

export default function BudgetPage() {
  const { budgetCategories } = useFinance();
  const [editing, setEditing] = useState<BudgetCategory | null>(null);
  const totals = getBudgetTotals(budgetCategories);

  return (
    <div>
      <PageHeader title="Budget" subtitle="Plan and track your monthly spending by category." />

      <div className="space-y-6">
        <BudgetSummaryCards
          totalBudgeted={totals.totalBudgeted}
          totalSpent={totals.totalSpent}
          remaining={totals.remaining}
          utilization={totals.utilization}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {budgetCategories.map((c) => (
            <BudgetCategoryCard key={c.id} category={c} onEdit={() => setEditing(c)} />
          ))}
        </div>

        <BudgetRecommendations categories={budgetCategories} />
      </div>

      <BudgetEditDialog category={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
}
