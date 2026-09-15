"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency } from "@/lib/currency";

export function NetCashflowChart({ data }: { data: { month: string; net: number }[] }) {
  return (
    <ResponsiveContainer width="99%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          width={52}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          content={({ active, label, payload }) => (
            <ChartTooltip
              active={active}
              label={label}
              payload={payload?.map((p) => ({
                name: "Net Cash Flow",
                value: p.value as number,
                color: (p.value as number) >= 0 ? "var(--success)" : "var(--destructive)",
              }))}
            />
          )}
        />
        <Bar animationDuration={450} dataKey="net" radius={[4, 4, 0, 0]} maxBarSize={36}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.net >= 0 ? "var(--success)" : "var(--destructive)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
