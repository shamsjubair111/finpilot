"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency } from "@/lib/currency";
import { SERIES_COLORS } from "@/lib/chart-colors";

export function SavingsGrowthChart({ data }: { data: { month: string; balance: number }[] }) {
  return (
    <ResponsiveContainer width="99%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="savingsGrowthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_COLORS.savings} stopOpacity={0.3} />
            <stop offset="100%" stopColor={SERIES_COLORS.savings} stopOpacity={0} />
          </linearGradient>
        </defs>
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
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={({ active, label, payload }) => (
            <ChartTooltip
              active={active}
              label={label}
              payload={payload?.map((p) => ({ name: "Savings Balance", value: p.value as number, color: SERIES_COLORS.savings }))}
            />
          )}
        />
        <Area
          type="monotone"
          animationDuration={450}
          dataKey="balance"
          name="Savings Balance"
          stroke={SERIES_COLORS.savings}
          strokeWidth={2.5}
          fill="url(#savingsGrowthFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
