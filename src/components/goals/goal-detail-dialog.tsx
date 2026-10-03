"use client";

import { formatDate } from "@/lib/format-date";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddFunds } from "@/components/shared/add-funds";
import { useFinance } from "@/components/providers/finance-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/finance/progress-bar";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { formatCurrency } from "@/lib/currency";
import {
  calculateGoalProgress,
  calculateGoalRemaining,
  calculateMonthsToGoal,
  estimateCompletionDate,
  getGoalStatus,
} from "@/lib/calculations/goals";
import type { FinancialGoal } from "@/types/finance";
import { cn } from "cn";
import { t } from "@/lib/i18n";

const STATUS_META = {
  completed: { label: "Completed", className: "bg-success/10 text-success" },
  on_track: { label: "On Track", className: "bg-primary/10 text-primary" },
  behind: { label: "Behind Schedule", className: "bg-warning/10 text-warning" },
};

export function GoalDetailDialog({
  goal,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  goal: FinancialGoal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { updateGoal } = useFinance();
  if (!goal) return null;

  const progress = calculateGoalProgress(goal.currentAmount, goal.goalAmount);
  const remaining = calculateGoalRemaining(goal.currentAmount, goal.goalAmount);
  const monthsToGoal = calculateMonthsToGoal(goal.currentAmount, goal.goalAmount, goal.monthlyContribution);
  const estCompletion = Number.isFinite(monthsToGoal) ? estimateCompletionDate(monthsToGoal) : null;
  const status = getGoalStatus(goal);
  const statusMeta = STATUS_META[status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex size-11 items-center justify-center rounded-lg"
              style={{ backgroundColor: `color-mix(in oklch, ${goal.color}, transparent 85%)`, color: goal.color }}
            >
              <DynamicIcon name={goal.icon} className="size-5" />
            </div>
            <div>
              <DialogTitle>{goal.name}</DialogTitle>
              <DialogDescription>{goal.description ?? t("Financial goal")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Badge className={cn("font-medium", statusMeta.className)} variant="secondary">
              {t(statusMeta.label)}
            </Badge>
            <span className="text-2xl font-bold tabular-nums text-primary">{progress}%</span>
          </div>

          <ProgressBar value={progress} className="h-2" label={goal.name} />

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("Current Amount")}</p>
              <p className="text-base font-semibold tabular-nums">{formatCurrency(goal.currentAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Goal Amount")}</p>
              <p className="text-base font-semibold tabular-nums">{formatCurrency(goal.goalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Remaining")}</p>
              <p className="text-base font-semibold tabular-nums">{formatCurrency(remaining)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Monthly Contribution")}</p>
              <p className="text-base font-semibold tabular-nums">{formatCurrency(goal.monthlyContribution)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Target Date")}</p>
              <p className="text-base font-semibold">{formatDate(goal.targetDate, "MMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Est. Completion")}</p>
              <p className="text-base font-semibold">
                {estCompletion ? formatDate(estCompletion, "MMM d, yyyy") : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("Priority")}</span>
            <span className="font-medium">{t({ high: "High", medium: "Medium", low: "Low" }[goal.priority])}</span>
          </div>

          {status !== "completed" && (
            <div className="space-y-2 rounded-xl bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("Contribute to this goal")}</p>
              <AddFunds
                onAdd={(amount) =>
                  updateGoal(goal.id, { currentAmount: goal.currentAmount + amount }, goal.currentAmount + amount >= goal.goalAmount ? t("🎉 {name} reached!", { name: goal.name }) : "Funds added")
                }
              />
            </div>
          )}

          <div className="flex gap-2 border-t border-border pt-4">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={onEdit}>
              <Pencil className="size-3.5" /> {t("Edit")}
            </Button>
            <Button variant="destructive" className="flex-1 gap-1.5" onClick={onDelete}>
              <Trash2 className="size-3.5" /> {t("Delete")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
