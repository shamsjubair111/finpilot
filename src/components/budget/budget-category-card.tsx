"use client";

import { Card } from "@/components/ui/card";
import { RowActions } from "@/components/shared/row-actions";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/finance/progress-bar";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { getBudgetStatus } from "@/lib/calculations/budget";
import { formatCurrency } from "@/lib/currency";
import type { BudgetCategory } from "@/types/finance";
import { cn } from "cn";

const STATUS_LABEL: Record<ReturnType<typeof getBudgetStatus>, string> = {
  on_track: "On track",
  near_limit: "Near limit",
  over_budget: "Over budget",
};

const STATUS_BADGE: Record<ReturnType<typeof getBudgetStatus>, string> = {
  on_track: "bg-success/10 text-success",
  near_limit: "bg-warning/10 text-warning",
  over_budget: "bg-destructive/10 text-destructive",
};

export function BudgetCategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: BudgetCategory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getBudgetStatus(category.spent, category.budgeted);
  const pct = Math.round((category.spent / category.budgeted) * 100);
  const remaining = category.budgeted - category.spent;

  return (
    <Card className="card-hover relative gap-3 overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: category.color }} />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in oklch, ${category.color}, transparent 85%)`, color: category.color }}
          >
            <DynamicIcon name={category.icon} className="size-[18px]" />
          </div>
          <div>
            <p className="text-sm font-semibold">{category.category}</p>
            <Badge className={cn("mt-0.5 font-normal", STATUS_BADGE[status])} variant="secondary">
              {STATUS_LABEL[status]}
            </Badge>
          </div>
        </div>
        <RowActions label={`${category.category} budget`} onEdit={onEdit} onDelete={onDelete} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold tabular-nums">{formatCurrency(category.spent)}</span>
          <span className="text-xs text-muted-foreground">of {formatCurrency(category.budgeted)}</span>
        </div>
        <ProgressBar value={pct} status={status} />
        <p className={cn("text-xs", remaining < 0 ? "text-destructive" : "text-muted-foreground")}>
          {remaining >= 0
            ? `${formatCurrency(remaining)} remaining`
            : `${formatCurrency(Math.abs(remaining))} over budget`}
        </p>
      </div>
    </Card>
  );
}
