"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { SERIES_COLORS } from "@/lib/chart-colors";

export function GoalProgressBarChart({
  data,
}: {
  data: { name: string; progress: number }[];
}) {
  return (
    <ResponsiveContainer width="99%" height={Math.max(180, data.length * 46)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={130}
          tick={{ fill: "var(--foreground)", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          content={({ active, payload }) => (
            <ChartTooltip
              active={active}
              payload={payload?.map((p) => ({
                name: "Progress",
                value: p.value as number,
                color: SERIES_COLORS.savings,
              }))}
              formatter={(v) => `${v}%`}
            />
          )}
        />
        <Bar animationDuration={450} dataKey="progress" radius={[0, 6, 6, 0]} maxBarSize={18}>
          {data.map((_, i) => (
            <Cell key={i} fill={SERIES_COLORS.savings} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
