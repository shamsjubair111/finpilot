"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ScenarioInputsPanel } from "@/components/scenario/scenario-inputs-panel";
import { ScenarioOutputCards } from "@/components/scenario/scenario-output-cards";
import { ScenarioComparison } from "@/components/scenario/scenario-comparison";
import { ScenarioInsights } from "@/components/scenario/scenario-insights";
import { ScenarioProjectionChart } from "@/components/charts/scenario-projection-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { runScenarioProjection, runBaselineProjection } from "@/lib/calculations/scenario";
import { defaultScenarioInput } from "@/lib/derive";
import { useFinance } from "@/components/providers/finance-provider";
import type { ScenarioInput } from "@/types/finance";

export default function ScenarioLabPage() {
  const { user, budgetCategories } = useFinance();
  const baseline = useMemo(() => defaultScenarioInput(user, budgetCategories), [user, budgetCategories]);
  const [input, setInput] = useState<ScenarioInput>(baseline);

  const handleChange = (patch: Partial<ScenarioInput>) => {
    setInput((prev) => {
      const next = { ...prev, ...patch };
      // Keep purchase month valid if the period shrinks below it.
      if (next.purchaseMonth > next.periodMonths) next.purchaseMonth = next.periodMonths;
      return next;
    });
  };

  const handleReset = () => setInput(baseline);

  const scenarioResult = useMemo(() => runScenarioProjection(input), [input]);
  const baselineResult = useMemo(() => runBaselineProjection(input), [input]);

  const chartData = useMemo(
    () =>
      scenarioResult.projections.map((p, i) => ({
        label: p.label,
        scenario: p.savingsBalance,
        current: baselineResult.projections[i]?.savingsBalance ?? 0,
      })),
    [scenarioResult, baselineResult]
  );

  return (
    <div>
      <PageHeader
        title="Scenario Lab"
        subtitle={
          user.monthlySalary > 0
            ? "Starts from your saved profile and budgets — adjust the levers to simulate your future."
            : "Tip: set your monthly salary in Settings so scenarios start from your real numbers."
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        <div className="order-2 lg:order-1">
          <ScenarioInputsPanel input={input} onChange={handleChange} onReset={handleReset} />
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <ScenarioOutputCards result={scenarioResult} />

          <Card className="animate-in-up">
            <CardHeader>
              <CardTitle>Projected Balance Over Time</CardTitle>
              <CardDescription>
                Scenario plan vs. your current plan over {input.periodMonths} months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScenarioProjectionChart data={chartData} />
            </CardContent>
          </Card>

          <ScenarioComparison
            periodMonths={input.periodMonths}
            currentSavings={input.currentSavings + baselineResult.totalProjectedSavings}
            scenarioSavings={input.currentSavings + scenarioResult.totalProjectedSavings}
          />

          <ScenarioInsights insights={scenarioResult.insights} />
        </div>
      </div>
    </div>
  );
}
