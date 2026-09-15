"use client";

import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/finance/progress-bar";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { AffordabilityBadge } from "./affordability-badge";
import { formatCurrency } from "@/lib/currency";
import { calculateAffordabilityScore, type AffordabilityContext } from "@/lib/calculations/affordability";
import type { PurchaseGoal } from "@/types/finance";
import { cn } from "cn";

const CATEGORY_ICON: Record<string, string> = {
  Electronics: "Laptop",
  Vehicle: "Bike",
  Home: "Home",
  Travel: "Plane",
  Other: "ShoppingBag",
};

const CATEGORY_TINT: Record<string, string> = {
  Electronics: "var(--cat-1)",
  Vehicle: "var(--cat-4)",
  Home: "var(--cat-3)",
  Travel: "var(--cat-5)",
  Other: "var(--cat-6)",
};

const PRIORITY_STYLE: Record<PurchaseGoal["priority"], string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

export function PurchaseCard({
  purchase,
  affordabilityBase,
  onClick,
}: {
  purchase: PurchaseGoal;
  affordabilityBase: Omit<AffordabilityContext, "price" | "savedAmount" | "priority">;
  onClick: () => void;
}) {
  const result = calculateAffordabilityScore({
    price: purchase.price,
    savedAmount: purchase.savedAmount,
    priority: purchase.priority,
    ...affordabilityBase,
  });
  const progress = Math.min(100, Math.round((purchase.savedAmount / purchase.price) * 100));

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
            style={{
              backgroundColor: `color-mix(in oklch, ${CATEGORY_TINT[purchase.category] ?? "var(--cat-6)"}, transparent 85%)`,
              color: CATEGORY_TINT[purchase.category] ?? "var(--cat-6)",
            }}
          >
            <DynamicIcon name={CATEGORY_ICON[purchase.category] ?? "ShoppingBag"} className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{purchase.name}</p>
            <Badge className={cn("mt-0.5 font-normal capitalize", PRIORITY_STYLE[purchase.priority])} variant="secondary">
              {purchase.priority} priority
            </Badge>
          </div>
        </div>
        <AffordabilityBadge result={result} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold tabular-nums">{formatCurrency(purchase.savedAmount)}</span>
          <span className="text-xs text-muted-foreground">of {formatCurrency(purchase.price)}</span>
        </div>
        <ProgressBar value={progress} />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{purchase.category}</span>
        <span>Wanted by {format(new Date(purchase.desiredDate), "MMM yyyy")}</span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">Affordability Score</span>
        <span className="font-bold tabular-nums text-foreground">{result.score}/100</span>
      </div>
    </Card>
  );
}
