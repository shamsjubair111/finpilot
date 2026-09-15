"use client";

import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
}: {
  category: BudgetCategory;
  onEdit: () => void;
}) {
  const status = getBudgetStatus(category.spent, category.budgeted);
  const pct = Math.round((category.spent / category.budgeted) * 100);
  const remaining = category.budgeted - category.spent;

  return (
    <Card className="card-hover animate-in-up gap-3 p-5">
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
        <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${category.category} budget`}>
          <Pencil className="size-3.5" />
        </Button>
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
