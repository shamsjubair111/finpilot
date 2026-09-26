"use client";

import Link from "next/link";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/finance/progress-bar";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { getBudgetStatus } from "@/lib/calculations/budget";
import { formatCurrency } from "@/lib/currency";
import { t } from "@/lib/i18n";
import type { BudgetCategory } from "@/types/finance";
import { Wallet } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export function BudgetProgressSection({ categories }: { categories: BudgetCategory[] }) {
  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle>{t("Budget Progress")}</CardTitle>
        <CardAction><Button variant="ghost" size="sm" asChild>
          <Link href="/budget">{t("Manage budget")}</Link>
        </Button></CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length === 0 && (
          <EmptyState icon={Wallet} title={t("No budgets yet")} description={t("Set monthly limits per category to track your spending.")} action={<Button size="sm" asChild><Link href="/budget">{t("Create a budget")}</Link></Button>} />
        )}
        {categories.map((c) => {
          const status = getBudgetStatus(c.spent, c.budgeted);
          const pct = Math.round((c.spent / c.budgeted) * 100);
          return (
            <div key={c.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <DynamicIcon name={c.icon} className="size-3.5 text-muted-foreground" />
                  {t(c.category)}
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
