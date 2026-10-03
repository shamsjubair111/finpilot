import { cn } from "cn";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
  color?: string; // css color, overrides status-based color
  status?: "on_track" | "near_limit" | "over_budget";
  /** Accessible name, e.g. the budget or goal it belongs to. */
  label?: string;
}

const STATUS_COLOR: Record<NonNullable<ProgressBarProps["status"]>, string> = {
  on_track: "var(--success)",
  near_limit: "var(--warning)",
  over_budget: "var(--destructive)",
};

export function ProgressBar({ value, className, barClassName, color, status, label }: ProgressBarProps) {
  const resolvedColor = color ?? (status ? STATUS_COLOR[status] : "var(--primary)");
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", barClassName)}
        style={{ width: `${clamped}%`, backgroundColor: resolvedColor }}
      />
    </div>
  );
}
