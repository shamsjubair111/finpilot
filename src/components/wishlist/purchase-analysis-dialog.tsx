"use client";

import * as React from "react";
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
import { t } from "@/lib/i18n";

export function PurchaseAnalysisDialog({
  purchase,
  affordabilityBase,
  goalMonthlyTotal,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
  purchase: PurchaseGoal | null;
  affordabilityBase: Omit<AffordabilityContext, "price" | "savedAmount" | "priority">;
  goalMonthlyTotal: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updatePurchase } = useFinance();
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle>{purchase.name}</DialogTitle>
              <DialogDescription>{t(purchase.category)} · {t({ high: "High priority", medium: "Medium priority", low: "Low priority" }[purchase.priority])}</DialogDescription>
            </div>
            <AffordabilityBadge result={result} />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("Price")}</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(purchase.price)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Saved")}</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(purchase.savedAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Remaining")}</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(remaining)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Est. Time")}</p>
              <p className="text-sm font-semibold">{t("{n} months", { n: chosen.estimatedMonths })}</p>
            </div>
          </div>

          {result.reasons.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t("Why this score")}</p>
              <ul className="space-y-1">
                {result.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-muted-foreground">· {r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2.5">
            <p className="text-sm font-semibold">{t("Savings Strategies")}</p>
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
                  <p className="text-xs font-semibold">{t(s.name)}</p>
                  <p className="mt-1 text-base font-bold tabular-nums">{formatCurrency(s.monthlyContribution, { compact: true })}{t("/mo")}</p>
                  <p className="text-xs text-muted-foreground">~{t("{n} months", { n: s.estimatedMonths })}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("Emergency Fund Impact")}</span>
              <span className="max-w-56 text-right text-xs font-medium">{impact.emergencyFundImpact}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("Other Goals Delayed")}</span>
              <span className="text-xs font-medium">{impact.otherGoalsDelayed ? t("Possibly, yes") : t("No")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("Free Cash After Contribution")}</span>
              <span className="text-xs font-medium tabular-nums">
                {formatCurrency(impact.remainingFreeCashAfterContribution)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("Target Purchase Date")}</span>
              <span className="text-xs font-medium">{formatDate(purchase.desiredDate, "MMM yyyy")}</span>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
            <p className="font-medium">{t("Recommendation")}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{recommendationText}</p>
          </div>

          {remaining > 0 && (
            <div className="space-y-2 rounded-xl bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("Put money aside for this item")}</p>
              <AddFunds
                label={t("Save")}
                onAdd={(amount) =>
                  updatePurchase(purchase.id, { savedAmount: purchase.savedAmount + amount })
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
