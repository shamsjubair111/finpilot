import { TrendingUp, TrendingDown, ShieldCheck, Percent, Gauge, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type { ScenarioResult } from "@/types/finance";
import { cn } from "cn";
import { t } from "@/lib/i18n";

const RISK_STYLE: Record<ScenarioResult["riskLevel"], string> = {
  low: "text-success bg-success/10",
  medium: "text-warning bg-warning/10",
  high: "text-destructive bg-destructive/10",
};

const CASHFLOW_STYLE: Record<ScenarioResult["cashFlowStatus"], string> = {
  positive: "text-success bg-success/10",
  tight: "text-warning bg-warning/10",
  negative: "text-destructive bg-destructive/10",
};

export function ScenarioOutputCards({ result }: { result: ScenarioResult }) {
  const items = [
    {
      label: "Projected Savings",
      value: formatCurrency(result.totalProjectedSavings),
      icon: TrendingUp,
      tone: "text-primary bg-primary/10",
    },
    {
      label: "Projected Spending",
      value: formatCurrency(result.totalProjectedSpending),
      icon: TrendingDown,
      tone: "text-destructive bg-destructive/10",
    },
    {
      label: "Final Emergency Fund",
      value: formatCurrency(result.finalEmergencyFund),
      icon: ShieldCheck,
      tone: "text-success bg-success/10",
    },
    {
      label: "Savings Rate",
      value: `${formatNumber(result.savingsRate)}%`,
      icon: Percent,
      tone: "text-primary bg-primary/10",
    },
    {
      label: "Lowest Balance",
      value: formatCurrency(result.lowestProjectedBalance),
      icon: Gauge,
      tone: result.lowestProjectedBalance < 0 ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted",
    },
    {
      label: "Cash-Flow Status",
      value: t({ positive: "Positive", tight: "Tight", negative: "Negative" }[result.cashFlowStatus]),
      icon: AlertTriangle,
      tone: CASHFLOW_STYLE[result.cashFlowStatus],
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label} className="animate-in-up gap-2 p-4">
          <div className={cn("flex size-8 items-center justify-center rounded-lg", item.tone)}>
            <item.icon className="size-4" />
          </div>
          <p className="text-[11px] text-muted-foreground">{t(item.label)}</p>
          <p className="text-base font-semibold tabular-nums">{item.value}</p>
        </Card>
      ))}
      <Card className="col-span-2 animate-in-up gap-2 p-4 sm:col-span-3 lg:col-span-6">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("Financial Risk Level")}</span>
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", RISK_STYLE[result.riskLevel])}>
            {t({ low: "Low risk", medium: "Medium risk", high: "High risk" }[result.riskLevel])}
          </span>
        </div>
      </Card>
    </div>
  );
}
