"use client";

import { format } from "date-fns";
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

const STATUS_META = {
  completed: { label: "Completed", className: "bg-success/10 text-success" },
  on_track: { label: "On Track", className: "bg-primary/10 text-primary" },
  behind: { label: "Behind Schedule", className: "bg-warning/10 text-warning" },
};

export function GoalDetailDialog({
  goal,
  open,
  onOpenChange,
}: {
  goal: FinancialGoal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!goal) return null;

  const progress = calculateGoalProgress(goal.currentAmount, goal.goalAmount);
  const remaining = calculateGoalRemaining(goal.currentAmount, goal.goalAmount);
  const monthsToGoal = calculateMonthsToGoal(goal.currentAmount, goal.goalAmount, goal.monthlyContribution);
  const estCompletion = Number.isFinite(monthsToGoal) ? estimateCompletionDate(monthsToGoal) : null;
  const status = getGoalStatus(goal);
  const statusMeta = STATUS_META[status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
              <DialogDescription>{goal.description ?? "Financial goal"}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Badge className={cn("font-medium", statusMeta.className)} variant="secondary">
              {statusMeta.label}
            </Badge>
            <span className="text-2xl font-bold tabular-nums text-primary">{progress}%</span>
          </div>

          <ProgressBar value={progress} className="h-2" />

          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="text-xs text-muted-foreground">Current Amount</p>
              <p className="text-base font-semibold tabular-nums">{formatCurrency(goal.currentAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Goal Amount</p>
              <p className="text-base font-semibold tabular-nums">{formatCurrency(goal.goalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-base font-semibold tabular-nums">{formatCurrency(remaining)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Contribution</p>
              <p className="text-base font-semibold tabular-nums">{formatCurrency(goal.monthlyContribution)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target Date</p>
              <p className="text-base font-semibold">{format(new Date(goal.targetDate), "MMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Est. Completion</p>
              <p className="text-base font-semibold">
                {estCompletion ? format(estCompletion, "MMM d, yyyy") : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Priority</span>
            <span className="font-medium capitalize">{goal.priority}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
