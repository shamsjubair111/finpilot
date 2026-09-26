"use client";

import { t } from "@/lib/i18n";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { MonthlyFinancials } from "@/types/finance";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency } from "@/lib/currency";
import { SERIES_COLORS } from "@/lib/chart-colors";

export function CashFlowChart({ data }: { data: MonthlyFinancials[] }) {
  return (
    <ResponsiveContainer width="99%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_COLORS.income} stopOpacity={0.25} />
            <stop offset="100%" stopColor={SERIES_COLORS.income} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expensesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_COLORS.expenses} stopOpacity={0.2} />
            <stop offset="100%" stopColor={SERIES_COLORS.expenses} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          dy={8}
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
              payload={payload?.map((p) => ({
                name: p.name as string,
                value: p.value as number,
                color: p.color as string,
              }))}
            />
          )}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)", paddingTop: 12 }}
        />
        <Area
          type="monotone"
          animationDuration={450}
          dataKey="income"
          name={t("Income")}
          stroke={SERIES_COLORS.income}
          strokeWidth={2}
          fill="url(#incomeFill)"
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Area
          type="monotone"
          animationDuration={450}
          dataKey="expenses"
          name={t("Expenses")}
          stroke={SERIES_COLORS.expenses}
          strokeWidth={2}
          fill="url(#expensesFill)"
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          animationDuration={450}
          dataKey="savings"
          name={t("Savings")}
          stroke={SERIES_COLORS.savings}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
