"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { BudgetCategory } from "@/types/finance";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency } from "@/lib/currency";
import { CATEGORY_COLORS } from "@/lib/chart-colors";

export function CategoryBarChart({ categories }: { categories: BudgetCategory[] }) {
  const sorted = [...categories].sort((a, b) => b.spent - a.spent);

  return (
    <ResponsiveContainer width="99%" height={Math.max(220, sorted.length * 40)}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number"
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="category"
          tickLine={false}
          axisLine={false}
          width={100}
          tick={{ fill: "var(--foreground)", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          content={({ active, payload }) => (
            <ChartTooltip
              active={active}
              payload={payload?.map((p) => ({
                name: "Spent",
                value: p.value as number,
                color: CATEGORY_COLORS[(p.payload as BudgetCategory).category],
              }))}
            />
          )}
        />
        <Bar animationDuration={450} dataKey="spent" radius={[0, 6, 6, 0]} maxBarSize={20}>
          {sorted.map((c) => (
            <Cell key={c.id} fill={CATEGORY_COLORS[c.category]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
