import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBudgetStatus } from "@/lib/calculations/budget";
import { formatCurrency } from "@/lib/currency";
import type { BudgetCategory } from "@/types/finance";
import { t } from "@/lib/i18n";

function buildRecommendations(categories: BudgetCategory[]): string[] {
  const recs: string[] = [];

  for (const c of categories) {
    const status = getBudgetStatus(c.spent, c.budgeted);
    const pct = Math.round((c.spent / c.budgeted) * 100);

    if (status === "over_budget") {
      recs.push(t("{category} is {pct}% of its monthly limit — you're {amount} over.", { category: t(c.category), pct, amount: formatCurrency(c.spent - c.budgeted) }));
    } else if (status === "near_limit") {
      recs.push(t("{category} is at {pct}% of its monthly limit.", { category: t(c.category), pct }));
    }
  }

  const discretionary = categories.filter((c) =>
    ["Entertainment", "Shopping", "Subscriptions"].includes(c.category)
  );
  const potentialSavings = discretionary.reduce((sum, c) => sum + Math.round(c.spent * 0.15), 0);
  if (potentialSavings > 0) {
    recs.push(
      t("You could save {amount} by trimming 15% off discretionary categories like Shopping and Entertainment.", { amount: formatCurrency(potentialSavings) })
    );
  }

  const healthy = categories.filter((c) => getBudgetStatus(c.spent, c.budgeted) === "on_track");
  if (healthy.length >= 3) {
    recs.push(t("{count} categories are comfortably on track this month — nice discipline.", { count: healthy.length }));
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
          {t("Budget Recommendations")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("No recommendations yet — they'll appear as you record expenses.")}</p>
        )}
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
