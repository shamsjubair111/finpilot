import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBudgetStatus } from "@/lib/calculations/budget";
import { formatCurrency } from "@/lib/currency";
import type { BudgetCategory } from "@/types/finance";

function buildRecommendations(categories: BudgetCategory[]): string[] {
  const recs: string[] = [];

  for (const c of categories) {
    const status = getBudgetStatus(c.spent, c.budgeted);
    const pct = Math.round((c.spent / c.budgeted) * 100);

    if (status === "over_budget") {
      recs.push(`${c.category} is ${pct}% of its monthly limit — you're ${formatCurrency(c.spent - c.budgeted)} over.`);
    } else if (status === "near_limit") {
      recs.push(`${c.category} is at ${pct}% of its monthly limit.`);
    }
  }

  const discretionary = categories.filter((c) =>
    ["Entertainment", "Shopping", "Subscriptions"].includes(c.category)
  );
  const potentialSavings = discretionary.reduce((sum, c) => sum + Math.round(c.spent * 0.15), 0);
  if (potentialSavings > 0) {
    recs.push(
      `You could save ${formatCurrency(potentialSavings)} by trimming 15% off discretionary categories like Shopping and Entertainment.`
    );
  }

  const healthy = categories.filter((c) => getBudgetStatus(c.spent, c.budgeted) === "on_track");
  if (healthy.length >= 3) {
    recs.push(`${healthy.length} categories are comfortably on track this month — nice discipline.`);
  }

  return recs;
}

export function BudgetRecommendations({ categories }: { categories: BudgetCategory[] }) {
  const recommendations = buildRecommendations(categories);

  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="size-4 text-warning" />
          Budget Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
              {r}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
