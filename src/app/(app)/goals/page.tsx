"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalDetailDialog } from "@/components/goals/goal-detail-dialog";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { useFinance } from "@/components/providers/finance-provider";
import { formatCurrency } from "@/lib/currency";
import type { FinancialGoal } from "@/types/finance";

export default function GoalsPage() {
  const { goals, deleteGoal } = useFinance();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FinancialGoal | null>(null);
  const [deleting, setDeleting] = useState<FinancialGoal | null>(null);
  const selected = goals.find((g) => g.id === selectedId) ?? null;

  const saved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const target = goals.reduce((s, g) => s + g.goalAmount, 0);

  const addButton = (
    <Button size="sm" className="gap-1.5" onClick={() => setCreating(true)}>
      <Plus className="size-4" />
      Add Goal
    </Button>
  );

  return (
    <div>
      <PageHeader
        title="Financial Goals"
        subtitle={
          goals.length
            ? `${formatCurrency(saved)} saved of ${formatCurrency(target)} across ${goals.length} goal${goals.length > 1 ? "s" : ""}.`
            : "Track progress toward everything you're saving for."
        }
        actions={goals.length > 0 && addButton}
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create your first financial goal — an emergency fund, a trip, a new laptop — and watch it grow."
          action={addButton}
        />
      ) : (
        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onClick={() => setSelectedId(goal.id)} />
          ))}
        </div>
      )}

      <GoalDetailDialog
        goal={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
        onEdit={() => {
          setEditing(selected);
          setSelectedId(null);
        }}
        onDelete={() => {
          setDeleting(selected);
          setSelectedId(null);
        }}
      />
      <GoalFormDialog open={creating} onOpenChange={setCreating} />
      <GoalFormDialog goal={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete goal?"
        description={`"${deleting?.name}" and its progress will be permanently removed.`}
        onConfirm={() => deleteGoal(deleting!.id)}
      />
    </div>
  );
}
