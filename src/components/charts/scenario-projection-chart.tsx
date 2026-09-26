"use client";

import { t } from "@/lib/i18n";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency } from "@/lib/currency";
import { SERIES_COLORS } from "@/lib/chart-colors";

export interface ScenarioChartPoint {
  label: string;
  current: number;
  scenario: number;
}

export function ScenarioProjectionChart({ data }: { data: ScenarioChartPoint[] }) {
  return (
    <ResponsiveContainer width="99%" height={320}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="scenarioFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_COLORS.scenario} stopOpacity={0.22} />
            <stop offset="100%" stopColor={SERIES_COLORS.scenario} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          width={56}
        />
        <ReferenceLine y={0} stroke="var(--destructive)" strokeDasharray="4 4" strokeOpacity={0.5} />
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
          dataKey="scenario"
          name={t("Scenario Plan")}
          stroke={SERIES_COLORS.scenario}
          strokeWidth={2.5}
          fill="url(#scenarioFill)"
          dot={false}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          animationDuration={450}
          dataKey="current"
          name={t("Current Plan")}
          stroke={SERIES_COLORS.current}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
