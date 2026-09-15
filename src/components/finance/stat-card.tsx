import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "cn";
import { InfoTooltip } from "@/components/shared/info-tooltip";

interface StatCardProps {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  tooltip?: string;
  value: ReactNode;
  secondary?: ReactNode;
  trend?: { value: number; label?: string; positiveIsGood?: boolean };
  footer?: ReactNode;
  className?: string;
}

export function StatCard({
  icon: Icon,
  iconClassName,
  label,
  tooltip,
  value,
  secondary,
  trend,
  footer,
  className,
}: StatCardProps) {
  const trendPositive = trend ? trend.value >= 0 : undefined;
  const trendGood = trend ? (trend.positiveIsGood ?? true) === trendPositive : undefined;

  return (
    <Card className={cn("card-hover animate-in-up gap-3 p-5", className)}>
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary",
            iconClassName
          )}
        >
          <Icon className="size-[18px]" strokeWidth={2} />
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
              trendGood ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}
          >
            {trendPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(trend.value)}
            {trend.label ?? "%"}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {secondary && <p className="text-xs text-muted-foreground">{secondary}</p>}
      </div>

      {footer}
    </Card>
  );
}
