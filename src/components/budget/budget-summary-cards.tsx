import { Wallet, TrendingDown, PiggyBank, Gauge } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";

export function BudgetSummaryCards({
  totalBudgeted,
  totalSpent,
  remaining,
  utilization,
}: {
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  utilization: number;
}) {
  const items = [
    { label: "Total Budget", value: formatCurrency(totalBudgeted), icon: Wallet, tone: "text-primary bg-primary/10" },
    { label: "Spent So Far", value: formatCurrency(totalSpent), icon: TrendingDown, tone: "text-destructive bg-destructive/10" },
    { label: "Remaining", value: formatCurrency(remaining), icon: PiggyBank, tone: "text-success bg-success/10" },
    { label: "Utilization", value: `${utilization}%`, icon: Gauge, tone: "text-warning bg-warning/10" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="animate-in-up gap-2 p-4">
          <div className={`flex size-8 items-center justify-center rounded-lg ${item.tone}`}>
            <item.icon className="size-4" />
          </div>
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-xl font-semibold tabular-nums">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
