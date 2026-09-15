import { formatCurrency } from "@/lib/currency";

interface TooltipPayloadItem {
  name: string;
  value: number;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadItem[];
  formatter?: (value: number) => string;
}

/**
 * Shared, premium-styled tooltip for all Recharts instances in the app.
 * Keeps tooltip visual language consistent across every chart.
 */
export function ChartTooltip({ active, label, payload, formatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const format = formatter ?? ((v: number) => formatCurrency(v));

  return (
    <div className="min-w-40 rounded-lg border border-border bg-popover px-3 py-2.5 text-popover-foreground shadow-lg">
      {label && <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="space-y-1">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-semibold tabular-nums text-foreground">{format(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
