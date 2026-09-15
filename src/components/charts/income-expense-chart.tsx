"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency } from "@/lib/currency";
import { SERIES_COLORS } from "@/lib/chart-colors";
import type { MonthlyFinancials } from "@/types/finance";

export function IncomeExpenseChart({ data }: { data: MonthlyFinancials[] }) {
  return (
    <ResponsiveContainer width="99%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          width={52}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          content={({ active, label, payload }) => (
            <ChartTooltip
              active={active}
              label={label}
              payload={payload?.map((p) => ({ name: p.name as string, value: p.value as number, color: p.color as string }))}
            />
          )}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)", paddingTop: 12 }} />
        <Bar animationDuration={450} dataKey="income" name="Income" fill={SERIES_COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar animationDuration={450} dataKey="expenses" name="Expenses" fill={SERIES_COLORS.expenses} radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
