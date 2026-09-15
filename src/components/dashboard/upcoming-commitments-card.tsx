import { format, differenceInCalendarDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { formatCurrency } from "@/lib/currency";
import type { UpcomingCommitment } from "@/types/finance";
import { cn } from "cn";

export function UpcomingCommitmentsCard({ commitments }: { commitments: UpcomingCommitment[] }) {
  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle>Upcoming Commitments</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {commitments.map((c) => {
            const daysAway = differenceInCalendarDays(new Date(c.dueDate), new Date());
            const soon = daysAway <= 5;
            return (
              <li key={c.id} className="flex items-center gap-3 rounded-lg px-1.5 py-2 hover:bg-muted/50">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <DynamicIcon name={c.icon} className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.category}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatCurrency(c.amount)}</p>
                  <p className={cn("text-xs", soon ? "text-warning" : "text-muted-foreground")}>
                    {format(new Date(c.dueDate), "MMM d")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
