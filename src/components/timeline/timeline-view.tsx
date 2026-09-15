import { format } from "date-fns";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { formatCurrency } from "@/lib/currency";
import type { TimelineMilestone } from "@/types/finance";
import { cn } from "cn";

const TYPE_STYLE: Record<TimelineMilestone["type"], string> = {
  purchase: "bg-primary/10 text-primary ring-primary/20",
  goal: "bg-success/10 text-success ring-success/20",
  emergency_fund: "bg-warning/10 text-warning ring-warning/20",
  contribution: "bg-muted text-muted-foreground ring-border",
};

export function TimelineView({ milestones }: { milestones: TimelineMilestone[] }) {
  const sorted = [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <ol className="relative space-y-8 border-l border-border pl-8 sm:pl-10">
      {sorted.map((m) => (
        <li key={m.id} className="animate-in-up relative">
          <span
            className={cn(
              "absolute -left-[calc(2rem+1px)] flex size-8 items-center justify-center rounded-full ring-4 ring-background sm:-left-[calc(2.5rem+1px)]",
              TYPE_STYLE[m.type]
            )}
          >
            <DynamicIcon name={m.icon} className="size-4" />
          </span>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {format(new Date(m.date), "MMMM yyyy")}
              </p>
              {m.amount !== undefined && (
                <span className="text-sm font-semibold tabular-nums">{formatCurrency(m.amount)}</span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold">{m.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
