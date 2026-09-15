"use client";

import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/finance/progress-bar";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { formatCurrency } from "@/lib/currency";
import { calculateGoalProgress, calculateGoalRemaining, calculateMonthsToGoal, estimateCompletionDate } from "@/lib/calculations/goals";
import type { FinancialGoal } from "@/types/finance";
import { cn } from "cn";

const PRIORITY_STYLE: Record<FinancialGoal["priority"], string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

export function GoalCard({ goal, onClick }: { goal: FinancialGoal; onClick: () => void }) {
  const progress = calculateGoalProgress(goal.currentAmount, goal.goalAmount);
  const remaining = calculateGoalRemaining(goal.currentAmount, goal.goalAmount);
  const monthsToGoal = calculateMonthsToGoal(goal.currentAmount, goal.goalAmount, goal.monthlyContribution);
  const estCompletion = Number.isFinite(monthsToGoal) ? estimateCompletionDate(monthsToGoal) : null;

  return (
    <Card
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="card-hover animate-in-up cursor-pointer gap-4 p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in oklch, ${goal.color}, transparent 85%)`, color: goal.color }}
          >
            <DynamicIcon name={goal.icon} className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{goal.name}</p>
            <Badge className={cn("mt-0.5 font-normal capitalize", PRIORITY_STYLE[goal.priority])} variant="secondary">
              {goal.priority} priority
            </Badge>
          </div>
        </div>
        <span className="text-lg font-bold tabular-nums text-primary">{progress}%</span>
      </div>

      <ProgressBar value={progress} />

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <p className="text-muted-foreground">Saved</p>
          <p className="font-semibold tabular-nums">{formatCurrency(goal.currentAmount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Target</p>
          <p className="font-semibold tabular-nums">{formatCurrency(goal.goalAmount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Remaining</p>
          <p className="font-semibold tabular-nums">{formatCurrency(remaining)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Target Date</p>
          <p className="font-semibold">{format(new Date(goal.targetDate), "MMM yyyy")}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="text-muted-foreground">
          {formatCurrency(goal.monthlyContribution)}/mo
        </span>
        <span className="font-medium">
          {estCompletion ? `Est. ${format(estCompletion, "MMM yyyy")}` : "Set a contribution"}
        </span>
      </div>
    </Card>
  );
}
