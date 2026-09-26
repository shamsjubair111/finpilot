"use client";

import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import type { MonthlyFinancials } from "@/types/finance";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export function CashFlowSection({ data }: { data: MonthlyFinancials[] }) {
  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle>{t("Monthly Cash Flow")}</CardTitle>
        <CardDescription>{t("Income, expenses, and savings over the last 6 months")}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.some((d) => d.income || d.expenses) ? (
          <CashFlowChart data={data} />
        ) : (
          <EmptyState icon={BarChart3} title={t("No cash flow yet")} description={t("Add income and expenses to see your monthly trend.")} />
        )}
      </CardContent>
    </Card>
  );
}
