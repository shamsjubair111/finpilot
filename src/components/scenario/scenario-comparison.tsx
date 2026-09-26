import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { cn } from "cn";
import { t } from "@/lib/i18n";

export function ScenarioComparison({
  periodMonths,
  currentSavings,
  scenarioSavings,
}: {
  periodMonths: number;
  currentSavings: number;
  scenarioSavings: number;
}) {
  const difference = scenarioSavings - currentSavings;
  const isPositive = difference >= 0;

  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle>{t("Current Plan vs. Scenario Plan")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="w-full space-y-1 rounded-lg border border-border p-4 text-center sm:text-left">
            <p className="text-xs text-muted-foreground">{t("Current plan — {n}-month savings", { n: periodMonths })}</p>
            <p className="text-xl font-semibold tabular-nums">{formatCurrency(currentSavings)}</p>
          </div>

          <ArrowRight className="hidden size-5 shrink-0 text-muted-foreground sm:block" />

          <div className="w-full space-y-1 rounded-lg border border-primary/30 bg-primary/5 p-4 text-center sm:text-left">
            <p className="text-xs text-muted-foreground">{t("Scenario — {n}-month savings", { n: periodMonths })}</p>
            <p className="text-xl font-semibold tabular-nums text-primary">{formatCurrency(scenarioSavings)}</p>
          </div>

          <div
            className={cn(
              "w-full shrink-0 space-y-1 rounded-lg p-4 text-center sm:w-auto sm:text-left",
              isPositive ? "bg-success/10" : "bg-destructive/10"
            )}
          >
            <p className="text-xs text-muted-foreground">{t("Difference")}</p>
            <p className={cn("text-xl font-bold tabular-nums", isPositive ? "text-success" : "text-destructive")}>
              {isPositive ? "+" : ""}
              {formatCurrency(difference)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
