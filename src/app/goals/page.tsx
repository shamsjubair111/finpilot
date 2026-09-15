"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalDetailDialog } from "@/components/goals/goal-detail-dialog";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { useFinance } from "@/components/providers/finance-provider";
import type { FinancialGoal } from "@/types/finance";

export default function GoalsPage() {
  const { goals } = useFinance();
  const [selected, setSelected] = useState<FinancialGoal | null>(null);

  return (
    <div>
      <PageHeader
        title="Financial Goals"
        subtitle="Track progress toward everything you're saving for."
        actions={
          <GoalFormDialog
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                Add Goal
              </Button>
            }
          />
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create your first financial goal to start tracking progress."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onClick={() => setSelected(goal)} />
          ))}
        </div>
      )}

      <GoalDetailDialog goal={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
