"use client";

import * as React from "react";
import { differenceInCalendarDays } from "date-fns";
import { CalendarClock, Check, Plus, Repeat, Zap } from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { RowActions } from "@/components/shared/row-actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { CommitmentFormDialog } from "@/components/commitments/commitment-form-dialog";
import { useFinance } from "@/components/providers/finance-provider";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { formatDate } from "@/lib/format-date";
import { t } from "@/lib/i18n";
import type { UpcomingCommitment } from "@/types/finance";

const PER_MONTH = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 } as const;
const FREQ_LABEL = { weekly: "Weekly", monthly: "Monthly", quarterly: "Every 3 months", yearly: "Yearly" } as const;

const monthlyOf = (c: UpcomingCommitment) => (c.recurring ? c.amount * PER_MONTH[c.frequency ?? "monthly"] : 0);

export default function RecurringPage() {
  const { commitments, deleteCommitment, payCommitment } = useFinance();
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<UpcomingCommitment | null>(null);
  const [deleting, setDeleting] = React.useState<UpcomingCommitment | null>(null);
  const [paying, setPaying] = React.useState<UpcomingCommitment | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const today = new Date();
  const withDays = commitments.map((c) => ({ c, days: differenceInCalendarDays(new Date(c.dueDate), today) }));
  const groups = [
    { key: "overdue", title: t("Overdue"), items: withDays.filter((x) => x.days < 0) },
    { key: "week", title: t("Due in the next 7 days"), items: withDays.filter((x) => x.days >= 0 && x.days <= 7) },
    { key: "later", title: t("Later"), items: withDays.filter((x) => x.days > 7) },
  ].filter((g) => g.items.length);

  const monthlyOut = commitments.filter((c) => c.type !== "income").reduce((s, c) => s + monthlyOf(c), 0);
  const monthlyIn = commitments.filter((c) => c.type === "income").reduce((s, c) => s + monthlyOf(c), 0);
  const dueSoon = withDays.filter((x) => x.days <= 7 && x.c.type !== "income").reduce((s, x) => s + x.c.amount, 0);

  async function quickPay(c: UpcomingCommitment) {
    setBusyId(c.id);
    await payCommitment(c.id);
    setBusyId(null);
  }

  return (
    <div>
      <PageHeader
        editOnly
        title={t("Bills & recurring")}
        subtitle={t("Rent, bills, EMIs, subscriptions and regular income — marked paid in one tap.")}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            {t("Add")}
          </Button>
        }
      />

      <div className="stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: t("Fixed costs per month"), value: formatCurrency(monthlyOut) },
          { label: t("Regular income per month"), value: formatCurrency(monthlyIn) },
          { label: t("Due in the next 7 days"), value: formatCurrency(dueSoon) },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{s.value}</p>
          </Card>
        ))}
      </div>

      {commitments.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={CalendarClock}
              title={t("Nothing scheduled")}
              description={t("Add rent, bills or subscriptions so you're never caught off guard.")}
              action={<Button size="sm" onClick={() => setAdding(true)}>{t("Add commitment")}</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.key} className="animate-in-up">
              <CardHeader>
                <CardTitle className={cn("text-base", g.key === "overdue" && "text-destructive")}>{g.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {g.items.map(({ c, days }) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <DynamicIcon name={c.icon} className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.title}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{formatDate(c.dueDate, "d MMM yyyy")}</span>
                          <span>·</span>
                          <span>
                            {days < 0
                              ? t("{n} days late", { n: -days })
                              : days === 0
                                ? t("Today")
                                : t("in {n} days", { n: days })}
                          </span>
                          {c.recurring && (
                            <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px]">
                              <Repeat className="size-3" />
                              {t(FREQ_LABEL[c.frequency ?? "monthly"])}
                            </Badge>
                          )}
                          {c.autoPost && (
                            <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px]">
                              <Zap className="size-3" />
                              {t("Automatic")}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className={cn("text-sm font-semibold tabular-nums", c.type === "income" && "text-success")}>
                        {c.type === "income" ? "+" : ""}
                        {formatCurrency(c.amount)}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="gap-1" disabled={busyId === c.id} onClick={() => quickPay(c)}>
                          <Check className="size-3.5" />
                          {c.type === "income" ? t("Received") : t("Paid")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setPaying(c)}>
                          {t("Other amount")}
                        </Button>
                        <RowActions label={c.title} onEdit={() => setEditing(c)} onDelete={() => setDeleting(c)} />
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CommitmentFormDialog open={adding} onOpenChange={setAdding} />
      <CommitmentFormDialog commitment={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
      <PayDialog commitment={paying} onClose={() => setPaying(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("Delete commitment?")}
        description={t("\"{name}\" will be removed permanently.", { name: deleting?.title ?? "" })}
        onConfirm={() => deleteCommitment(deleting!.id)}
      />
    </div>
  );
}

function PayDialog({ commitment, onClose }: { commitment: UpcomingCommitment | null; onClose: () => void }) {
  const { payCommitment } = useFinance();
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const [lastId, setLastId] = React.useState<string | null>(null);
  if (commitment && commitment.id !== lastId) {
    setLastId(commitment.id);
    setAmount(String(commitment.amount));
    setDate(new Date().toISOString().slice(0, 10));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!commitment) return;
    setPending(true);
    const ok = await payCommitment(commitment.id, { amount: Number(amount), date });
    setPending(false);
    if (ok) {
      setLastId(null);
      onClose();
    }
  }

  return (
    <Dialog open={!!commitment} onOpenChange={(o) => !o && !pending && (setLastId(null), onClose())}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("Record payment")}</DialogTitle>
            <DialogDescription>{commitment?.title}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pay-amount">{`${t("Amount")} (${getCurrencySymbol()})`}</Label>
              <Input id="pay-amount" type="number" min={0.01} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-date">{t("Date")}</Label>
              <Input id="pay-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>{t("Cancel")}</Button>
            <SubmitButton pending={pending} disabled={!(Number(amount) > 0) || !date}>{t("Save")}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
