"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/currency";
import { AffordabilityBadge } from "./affordability-badge";
import {
  calculateAffordabilityScore,
  calculatePurchaseStrategies,
  calculatePurchaseImpact,
  type AffordabilityContext,
} from "@/lib/calculations/affordability";
import type { PurchaseGoal } from "@/types/finance";
import { cn } from "cn";

export function PurchaseAnalysisDialog({
  purchase,
  affordabilityBase,
  goalMonthlyTotal,
  open,
  onOpenChange,
}: {
  purchase: PurchaseGoal | null;
  affordabilityBase: Omit<AffordabilityContext, "price" | "savedAmount" | "priority">;
  goalMonthlyTotal: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedStrategy, setSelectedStrategy] = React.useState(1); // default: Balanced
  const [loadedPurchaseId, setLoadedPurchaseId] = React.useState<string | null>(null);

  if (purchase && open && purchase.id !== loadedPurchaseId) {
    setLoadedPurchaseId(purchase.id);
    setSelectedStrategy(1);
  } else if (!open && loadedPurchaseId !== null) {
    setLoadedPurchaseId(null);
  }

  if (!purchase) return null;

  const remaining = Math.max(0, purchase.price - purchase.savedAmount);
  const result = calculateAffordabilityScore({
    price: purchase.price,
    savedAmount: purchase.savedAmount,
    priority: purchase.priority,
    ...affordabilityBase,
  });
  const strategies = calculatePurchaseStrategies(remaining);
  const chosen = strategies[selectedStrategy];

  const impact = calculatePurchaseImpact({
    remaining,
    monthlyContribution: chosen.monthlyContribution,
    emergencyFundCurrent: affordabilityBase.emergencyFundCoverage,
    emergencyFundTarget: 100,
    otherGoalsMonthlyTotal: goalMonthlyTotal,
    monthlyFreeCash: affordabilityBase.monthlyFreeCash,
  });

  const balancedStrategy = strategies[1];
  const recommendationText = `${balancedStrategy.name} strategy is recommended because it lets you purchase the ${purchase.name.toLowerCase()} in approximately ${balancedStrategy.estimatedMonths} month${balancedStrategy.estimatedMonths === 1 ? "" : "s"} while preserving your emergency reserve.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle>{purchase.name}</DialogTitle>
              <DialogDescription>{purchase.category} · {purchase.priority} priority</DialogDescription>
            </div>
            <AffordabilityBadge result={result} />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(purchase.price)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saved</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(purchase.savedAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(remaining)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Est. Time</p>
              <p className="text-sm font-semibold">{chosen.estimatedMonths} mo</p>
            </div>
          </div>

          {result.reasons.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Why this score</p>
              <ul className="space-y-1">
                {result.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-muted-foreground">· {r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2.5">
            <p className="text-sm font-semibold">Savings Strategies</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {strategies.map((s, i) => (
                <button
                  key={s.name}
                  onClick={() => setSelectedStrategy(i)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    selectedStrategy === i
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <p className="text-xs font-semibold">{s.name}</p>
                  <p className="mt-1 text-base font-bold tabular-nums">{formatCurrency(s.monthlyContribution, { compact: true })}/mo</p>
                  <p className="text-xs text-muted-foreground">~{s.estimatedMonths} months</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Emergency Fund Impact</span>
              <span className="max-w-56 text-right text-xs font-medium">{impact.emergencyFundImpact}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Other Goals Delayed</span>
              <span className="text-xs font-medium">{impact.otherGoalsDelayed ? "Possibly, yes" : "No"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Free Cash After Contribution</span>
              <span className="text-xs font-medium tabular-nums">
                {formatCurrency(impact.remainingFreeCashAfterContribution)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Target Purchase Date</span>
              <span className="text-xs font-medium">{format(new Date(purchase.desiredDate), "MMM yyyy")}</span>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
            <p className="font-medium">Recommendation</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{recommendationText}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
