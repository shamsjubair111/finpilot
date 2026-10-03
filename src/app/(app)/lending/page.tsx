"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, Handshake, Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/components/providers/finance-provider";
import { api } from "@/lib/api-client";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/format-date";
import { t } from "@/lib/i18n";

interface PersonalLoan {
  id: string;
  person: string;
  direction: "lent" | "borrowed";
  amount: number;
  repaid: number;
  date: string;
  dueDate?: string;
  note?: string;
  settledAt?: string;
}

type Filter = "open" | "settled";
const today = () => new Date().toISOString().slice(0, 10);
const left = (l: PersonalLoan) => Math.max(0, l.amount - l.repaid);

function LoanDialog({ open, onOpenChange, loan, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; loan?: PersonalLoan; onSaved: () => void }) {
  // Mounted fresh for each open (see `key` below), so the form starts from the loan being edited.
  const [form, setForm] = React.useState(() =>
    loan
      ? { person: loan.person, direction: loan.direction as string, amount: String(loan.amount), date: loan.date.slice(0, 10), dueDate: loan.dueDate?.slice(0, 10) ?? "", note: loan.note ?? "" }
      : { person: "", direction: "lent", amount: "", date: today(), dueDate: "", note: "" }
  );
  const [pending, setPending] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const body = { ...form, dueDate: form.dueDate || null, note: form.note || null };
      await api(loan ? `/personal-loans/${loan.id}` : "/personal-loans", { method: loan ? "PATCH" : "POST", body });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(t("Couldn't save"), { description: err instanceof Error ? err.message : undefined });
    } finally {
      setPending(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{loan ? t("Edit loan") : t("Add a loan")}</DialogTitle>
          <DialogDescription>{t("Money you lent to or borrowed from someone. It doesn't change your account balances.")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="loan-direction">{t("Type")}</Label>
              <Select value={form.direction} onValueChange={(v) => setForm((f) => ({ ...f, direction: v }))}>
                <SelectTrigger id="loan-direction" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lent">{t("I lent money")}</SelectItem>
                  <SelectItem value="borrowed">{t("I borrowed money")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-person">{form.direction === "lent" ? t("Lent to") : t("Borrowed from")}</Label>
              <Input id="loan-person" required maxLength={80} value={form.person} onChange={set("person")} placeholder={t("Name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-amount">{t("Amount")}</Label>
              <Input id="loan-amount" required type="number" inputMode="decimal" min="0.01" step="0.01" value={form.amount} onChange={set("amount")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-date">{t("Date")}</Label>
              <Input id="loan-date" required type="date" value={form.date} onChange={set("date")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-due">{t("Due date (optional)")}</Label>
              <Input id="loan-due" type="date" value={form.dueDate} onChange={set("dueDate")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-note">{t("Note (optional)")}</Label>
              <Input id="loan-note" maxLength={500} value={form.note} onChange={set("note")} />
            </div>
          </div>
          <DialogFooter>
            <SubmitButton pending={pending}>{t("Save")}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RepayDialog({ loan, onOpenChange, onSaved }: { loan?: PersonalLoan; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [amount, setAmount] = React.useState(() => (loan ? String(left(loan)) : ""));
  const [pending, setPending] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!loan) return;
    setPending(true);
    try {
      const repaid = Math.min(loan.amount, loan.repaid + Number(amount));
      await api(`/personal-loans/${loan.id}`, { method: "PATCH", body: { repaid, settledAt: repaid >= loan.amount ? new Date().toISOString() : null } });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(t("Couldn't save"), { description: err instanceof Error ? err.message : undefined });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={!!loan} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Record a repayment")}</DialogTitle>
          <DialogDescription>{loan && t("{left} is still outstanding.", { left: formatCurrency(left(loan)) })}</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="repay-amount">{t("Amount repaid")}</Label>
            <Input id="repay-amount" required type="number" inputMode="decimal" min="0.01" step="0.01" max={loan ? left(loan) : undefined} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <DialogFooter>
            <SubmitButton pending={pending}>{t("Save")}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function LendingPage() {
  const { readOnly } = useFinance();
  const [loans, setLoans] = React.useState<PersonalLoan[] | null>(null);
  const [filter, setFilter] = React.useState<Filter>("open");
  const [editing, setEditing] = React.useState<PersonalLoan | undefined>();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [repaying, setRepaying] = React.useState<PersonalLoan | undefined>();
  const [now] = React.useState(() => Date.now());

  const load = React.useCallback(() => {
    api<PersonalLoan[]>("/personal-loans")
      .then(setLoans)
      .catch((err) => {
        setLoans([]);
        toast.error(t("Couldn't load loans"), { description: err.message });
      });
  }, []);
  React.useEffect(load, [load]);

  const open = (loans ?? []).filter((l) => !l.settledAt);
  const owedToYou = open.filter((l) => l.direction === "lent").reduce((s, l) => s + left(l), 0);
  const youOwe = open.filter((l) => l.direction === "borrowed").reduce((s, l) => s + left(l), 0);
  const shown = (loans ?? []).filter((l) => (filter === "open" ? !l.settledAt : !!l.settledAt));

  async function remove(l: PersonalLoan) {
    if (!confirm(t("Delete this loan?"))) return;
    try {
      await api(`/personal-loans/${l.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      toast.error(t("Couldn't delete"), { description: err instanceof Error ? err.message : undefined });
    }
  }

  async function reopen(l: PersonalLoan) {
    try {
      await api(`/personal-loans/${l.id}`, { method: "PATCH", body: { settledAt: null } });
      load();
    } catch (err) {
      toast.error(t("Couldn't save"), { description: err instanceof Error ? err.message : undefined });
    }
  }

  const addButton = (
    <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
      <Plus className="size-4" /> {t("Add a loan")}
    </Button>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t("Lent & borrowed")} subtitle={t("Keep track of money between you and friends or family.")} actions={addButton} editOnly />

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">{t("Owed to you")}</p>
            <p className="text-xl font-semibold tabular-nums text-success">{formatCurrency(owedToYou)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">{t("You owe")}</p>
            <p className="text-xl font-semibold tabular-nums text-destructive">{formatCurrency(youOwe)}</p>
          </CardContent>
        </Card>
      </div>

      {loans && loans.length === 0 ? (
        <EmptyState icon={Handshake} title={t("No loans yet")} description={t("Lent a friend some money or borrowed from family? Note it here so nobody forgets.")} action={readOnly ? undefined : addButton} />
      ) : (
        <>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-4">
            <TabsList>
              <TabsTrigger value="open">{t("Open")}</TabsTrigger>
              <TabsTrigger value="settled">{t("Settled")}</TabsTrigger>
            </TabsList>
          </Tabs>
          {shown.length === 0 && loans && <p className="text-sm text-muted-foreground">{filter === "open" ? t("Everything is settled.") : t("Nothing settled yet.")}</p>}
          <ul className="space-y-3">
            {shown.map((l) => {
              const overdue = !l.settledAt && l.dueDate && new Date(l.dueDate).getTime() < now;
              return (
                <li key={l.id}>
                  <Card>
                    <CardContent className="space-y-3 pt-6">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{l.person}</p>
                          <p className="text-xs text-muted-foreground">
                            {l.direction === "lent" ? t("You lent") : t("You borrowed")} · {formatDate(l.date, "d MMM yyyy")}
                            {l.dueDate && <> · {t("due {date}", { date: formatDate(l.dueDate, "d MMM yyyy") })}</>}
                          </p>
                          {l.note && <p className="mt-1 text-xs text-muted-foreground">{l.note}</p>}
                        </div>
                        <div className="text-right">
                          <p className={cn("font-semibold tabular-nums", l.direction === "lent" ? "text-success" : "text-destructive")}>{formatCurrency(l.settledAt ? l.amount : left(l))}</p>
                          {overdue && <Badge variant="destructive">{t("Overdue")}</Badge>}
                          {l.settledAt && <Badge variant="secondary">{t("Settled")}</Badge>}
                        </div>
                      </div>
                      {!l.settledAt && l.repaid > 0 && (
                        <div className="space-y-1">
                          <Progress value={(l.repaid / l.amount) * 100} aria-label={t("Repaid")} />
                          <p className="text-xs text-muted-foreground">{t("{repaid} of {amount} repaid", { repaid: formatCurrency(l.repaid), amount: formatCurrency(l.amount) })}</p>
                        </div>
                      )}
                      {!readOnly && (
                        <div className="flex flex-wrap gap-2">
                          {l.settledAt ? (
                            <Button variant="outline" size="sm" onClick={() => reopen(l)}>
                              <Undo2 className="size-4" /> {t("Reopen")}
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => setRepaying(l)}>
                              <CheckCircle2 className="size-4" /> {t("Record repayment")}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => { setEditing(l); setDialogOpen(true); }}>
                            <Pencil className="size-4" /> {t("Edit")}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => remove(l)}>
                            <Trash2 className="size-4" /> {t("Delete")}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <LoanDialog key={dialogOpen ? editing?.id ?? "new" : "closed"} open={dialogOpen} onOpenChange={setDialogOpen} loan={editing} onSaved={load} />
      <RepayDialog key={repaying?.id ?? "none"} loan={repaying} onOpenChange={(v) => !v && setRepaying(undefined)} onSaved={load} />
    </div>
  );
}
