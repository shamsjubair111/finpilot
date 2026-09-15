import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/finance/progress-bar";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { getBudgetStatus } from "@/lib/calculations/budget";
import { formatCurrency } from "@/lib/currency";
import type { BudgetCategory } from "@/types/finance";

export function BudgetProgressSection({ categories }: { categories: BudgetCategory[] }) {
  return (
    <Card className="animate-in-up">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Budget Progress</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/budget">Manage budget</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((c) => {
          const status = getBudgetStatus(c.spent, c.budgeted);
          const pct = Math.round((c.spent / c.budgeted) * 100);
          return (
            <div key={c.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <DynamicIcon name={c.icon} className="size-3.5 text-muted-foreground" />
                  {c.category}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {formatCurrency(c.spent)} / {formatCurrency(c.budgeted)}
                </span>
              </div>
              <ProgressBar value={pct} status={status} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
