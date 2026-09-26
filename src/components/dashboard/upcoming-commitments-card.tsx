"use client";

import * as React from "react";
import { differenceInCalendarDays } from "date-fns";
import { formatDate } from "@/lib/format-date";
import { CalendarClock, Plus, Repeat } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { RowActions } from "@/components/shared/row-actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CommitmentFormDialog } from "@/components/commitments/commitment-form-dialog";
import { useFinance } from "@/components/providers/finance-provider";
import { formatCurrency } from "@/lib/currency";
import type { UpcomingCommitment } from "@/types/finance";
import { cn } from "cn";
import { t } from "@/lib/i18n";

export function UpcomingCommitmentsCard() {
  const { commitments, deleteCommitment } = useFinance();
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<UpcomingCommitment | null>(null);
  const [deleting, setDeleting] = React.useState<UpcomingCommitment | null>(null);

  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle>{t("Upcoming Commitments")}</CardTitle>
        <CardAction><Button variant="ghost" size="sm" className="gap-1" onClick={() => setAdding(true)}>
          <Plus className="size-3.5" /> {t("Add")}
        </Button></CardAction>
      </CardHeader>
      <CardContent>
        {commitments.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title={t("Nothing scheduled")}
            description={t("Add rent, bills or subscriptions so you're never caught off guard.")}
            action={<Button size="sm" onClick={() => setAdding(true)}>{t("Add commitment")}</Button>}
          />
        ) : (
          <ul className="space-y-1">
            {commitments.map((c) => {
              const daysAway = differenceInCalendarDays(new Date(c.dueDate), new Date());
              const overdue = daysAway < 0;
              const soon = daysAway <= 5;
              return (
                <li key={c.id} className="group flex items-center gap-3 rounded-xl px-1.5 py-2 transition-colors hover:bg-muted/50">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <DynamicIcon name={c.icon} className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {c.title}
                      {c.recurring && <Repeat className="size-3 shrink-0 text-muted-foreground" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{t(c.category)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatCurrency(c.amount)}</p>
                    <p className={cn("text-xs", overdue ? "text-destructive" : soon ? "text-warning" : "text-muted-foreground")}>
                      {overdue ? `${t("Overdue")} · ` : ""}
                      {formatDate(c.dueDate, "MMM d")}
                    </p>
                  </div>
                  <RowActions label={c.title} onEdit={() => setEditing(c)} onDelete={() => setDeleting(c)} />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <CommitmentFormDialog open={adding} onOpenChange={setAdding} />
      <CommitmentFormDialog commitment={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("Delete commitment?")}
        description={t("\"{name}\" will be removed permanently.", { name: deleting?.title ?? "" })}
        onConfirm={() => deleteCommitment(deleting!.id)}
      />
    </Card>
  );
}
