"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency } from "@/lib/currency";
import { SERIES_COLORS } from "@/lib/chart-colors";

export function SpendingTrendChart({ data }: { data: { month: string; expenses: number }[] }) {
  return (
    <ResponsiveContainer width="99%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          width={52}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={({ active, label, payload }) => (
            <ChartTooltip
              active={active}
              label={label}
              payload={payload?.map((p) => ({ name: "Expenses", value: p.value as number, color: SERIES_COLORS.expenses }))}
            />
          )}
        />
        <Line
          type="monotone"
          animationDuration={450}
          dataKey="expenses"
          name="Expenses"
          stroke={SERIES_COLORS.expenses}
          strokeWidth={2.5}
          dot={{ r: 3, fill: SERIES_COLORS.expenses, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
