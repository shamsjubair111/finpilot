import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import type { MonthlyFinancials } from "@/types/finance";

export function CashFlowSection({ data }: { data: MonthlyFinancials[] }) {
  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle>Monthly Cash Flow</CardTitle>
        <CardDescription>Income, expenses, and savings over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <CashFlowChart data={data} />
      </CardContent>
    </Card>
  );
}
