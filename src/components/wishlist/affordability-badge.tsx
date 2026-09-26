import { CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import type { AffordabilityResult } from "@/types/finance";
import { cn } from "cn";
import { t } from "@/lib/i18n";
import { formatNumber } from "@/lib/currency";

const STATUS_META: Record<
  AffordabilityResult["status"],
  { icon: typeof CheckCircle2; className: string }
> = {
  safe: { icon: CheckCircle2, className: "bg-success/10 text-success" },
  reasonable: { icon: Clock, className: "bg-primary/10 text-primary" },
  wait: { icon: AlertTriangle, className: "bg-warning/10 text-warning" },
  high_risk: { icon: XCircle, className: "bg-destructive/10 text-destructive" },
};

export function AffordabilityBadge({ result, compact }: { result: AffordabilityResult; compact?: boolean }) {
  const meta = STATUS_META[result.status];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        meta.className
      )}
    >
      <Icon className="size-3.5" />
      {compact ? `${formatNumber(result.score)}/${formatNumber(100)}` : t(result.label)}
    </span>
  );
}
