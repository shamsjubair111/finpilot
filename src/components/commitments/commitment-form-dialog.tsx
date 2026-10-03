"use client";

import { getCurrencySymbol } from "@/lib/currency";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { useFinance } from "@/components/providers/finance-provider";
import type { UpcomingCommitment } from "@/types/finance";
import { FREQUENCIES, type Frequency } from "@/lib/recurrence";

const NO_ACCOUNT = "__none__";
const FREQUENCY_LABELS: Record<Frequency, string> = { weekly: "Weekly", monthly: "Monthly", quarterly: "Every 3 months", yearly: "Yearly" };
import { t } from "@/lib/i18n";

const KINDS = [
  { value: "Bills", icon: "Receipt" },
  { value: "Housing", icon: "Home" },
  { value: "Subscriptions", icon: "Repeat" },
  { value: "Loan", icon: "Landmark" },
  { value: "Insurance", icon: "ShieldCheck" },
  { value: "Savings", icon: "PiggyBank" },
  { value: "Salary", icon: "Banknote" },
  { value: "Other", icon: "CalendarClock" },
];

export function CommitmentFormDialog({
  commitment,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  commitment?: UpcomingCommitment | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { addCommitment, updateCommitment, accounts } = useFinance();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEdit = !!commitment;

  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("Bills");
  const [amount, setAmount] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [recurring, setRecurring] = React.useState(true);
  const [frequency, setFrequency] = React.useState<Frequency>("monthly");
  const [type, setType] = React.useState<"income" | "expense" | "transfer">("expense");
  const [toAccountId, setToAccountId] = React.useState(NO_ACCOUNT);
  const [accountId, setAccountId] = React.useState(NO_ACCOUNT);
  const [autoPost, setAutoPost] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setTitle(commitment?.title ?? "");
    setCategory(commitment?.category ?? "Bills");
    setAmount(commitment ? String(commitment.amount) : "");
    setDueDate(commitment ? commitment.dueDate.slice(0, 10) : "");
    setRecurring(commitment?.recurring ?? true);
    setFrequency(commitment?.frequency ?? "monthly");
    setType(commitment?.type ?? "expense");
    setToAccountId(commitment?.toAccountId ?? NO_ACCOUNT);
    setAccountId(commitment?.accountId ?? NO_ACCOUNT);
    setAutoPost(commitment?.autoPost ?? false);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const isTransfer = type === "transfer";
  const isValid =
    title.trim() &&
    Number(amount) > 0 &&
    dueDate &&
    (!isTransfer || (accountId !== NO_ACCOUNT && toAccountId !== NO_ACCOUNT && accountId !== toAccountId));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setPending(true);
    const data = {
      title: title.trim(),
      category,
      amount: Number(amount),
      dueDate,
      recurring,
      frequency,
      type,
      accountId: accountId === NO_ACCOUNT ? null : accountId,
      toAccountId: isTransfer && toAccountId !== NO_ACCOUNT ? toAccountId : null,
      autoPost: recurring && autoPost,
      icon: KINDS.find((k) => k.value === category)?.icon ?? "CalendarClock",
    };
    const ok = isEdit ? await updateCommitment(commitment!.id, data) : await addCommitment(data);
    setPending(false);
    if (ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("Edit Commitment") : t("Add Commitment")}</DialogTitle>
          <DialogDescription>{t("Bills, subscriptions and other payments you know are coming.")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="cm-title">{t("Title")}</Label>
              <Input id="cm-title" placeholder={t("e.g. Internet bill")} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cm-amount">{`${t("Amount")} (${getCurrencySymbol()})`}</Label>
              <Input id="cm-amount" type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cm-date">{t("Due date")}</Label>
              <Input id="cm-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="cm-cat">{t("Type")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="cm-cat" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>{t(k.value)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cm-direction">{t("Money")}</Label>
              <Select value={type} onValueChange={(v) => setType(v as "income" | "expense" | "transfer")}>
                <SelectTrigger id="cm-direction" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">{t("Going out")}</SelectItem>
                  <SelectItem value="income">{t("Coming in")}</SelectItem>
                  <SelectItem value="transfer">{t("Moving between my accounts")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cm-account">{isTransfer ? t("From") : t("Account")}</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="cm-account" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {!isTransfer && <SelectItem value={NO_ACCOUNT}>{t("No account")}</SelectItem>}
                  {accounts.filter((a) => !a.archived).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isTransfer && (
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="cm-to">{t("To")}</Label>
                <Select value={toAccountId} onValueChange={setToAccountId}>
                  <SelectTrigger id="cm-to" className="w-full"><SelectValue placeholder={t("Select account")} /></SelectTrigger>
                  <SelectContent>
                    {accounts.filter((a) => !a.archived && a.id !== accountId).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("For DPS instalments, savings deposits or wallet top-ups. It isn't counted as spending.")}</p>
              </div>
            )}
            <div className="col-span-2 space-y-3 rounded-xl border border-border p-3">
              <label className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{t("Repeats")}</p>
                  <p className="text-xs text-muted-foreground">{t("After you mark it paid, the next due date is set automatically.")}</p>
                </div>
                <Switch checked={recurring} onCheckedChange={setRecurring} />
              </label>
              {recurring && (
                <>
                  <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                    <SelectTrigger aria-label={t("How often")} className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>{t(FREQUENCY_LABELS[f])}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{t("Record automatically")}</p>
                      <p className="text-xs text-muted-foreground">{t("Adds the transaction on the due date without asking. Best for fixed amounts like rent or salary.")}</p>
                    </div>
                    <Switch checked={autoPost} onCheckedChange={setAutoPost} />
                  </label>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("Cancel")}</Button>
            <SubmitButton pending={pending} disabled={!isValid}>{isEdit ? t("Save changes") : t("Add commitment")}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
