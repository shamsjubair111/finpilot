"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { BudgetCategory } from "@/types/finance";
import { CATEGORY_COLORS } from "@/lib/chart-colors";
import { formatCurrency } from "@/lib/currency";
import { ChartTooltip } from "./chart-tooltip";

export function ExpenseDonutChart({
  categories,
  totalLabel = "Total Spent",
}: {
  categories: BudgetCategory[];
  totalLabel?: string;
}) {
  const total = categories.reduce((sum, c) => sum + c.spent, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="99%" height={240}>
        <PieChart>
          <Pie
            data={categories}
            dataKey="spent"
            nameKey="category"
            innerRadius={72}
            outerRadius={100}
            paddingAngle={2}
            cornerRadius={4}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {categories.map((c) => (
              <Cell key={c.id} fill={CATEGORY_COLORS[c.category]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => (
              <ChartTooltip
                active={active}
                payload={payload?.map((p) => ({
                  name: p.name as string,
                  value: p.value as number,
                  color: (p.payload as BudgetCategory & { fill?: string })?.color
                    ? CATEGORY_COLORS[(p.payload as BudgetCategory).category]
                    : undefined,
                }))}
              />
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xs text-muted-foreground">{totalLabel}</p>
        <p className="text-xl font-semibold tabular-nums">{formatCurrency(total, { compact: true })}</p>
      </div>
    </div>
  );
}
