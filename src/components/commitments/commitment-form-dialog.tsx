"use client";

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

const KINDS = [
  { value: "Bills", icon: "Receipt" },
  { value: "Housing", icon: "Home" },
  { value: "Subscriptions", icon: "Repeat" },
  { value: "Loan", icon: "Landmark" },
  { value: "Insurance", icon: "ShieldCheck" },
  { value: "Savings", icon: "PiggyBank" },
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
  const { addCommitment, updateCommitment } = useFinance();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEdit = !!commitment;

  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("Bills");
  const [amount, setAmount] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [recurring, setRecurring] = React.useState(true);
  const [pending, setPending] = React.useState(false);

  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setTitle(commitment?.title ?? "");
    setCategory(commitment?.category ?? "Bills");
    setAmount(commitment ? String(commitment.amount) : "");
    setDueDate(commitment ? commitment.dueDate.slice(0, 10) : "");
    setRecurring(commitment?.recurring ?? true);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const isValid = title.trim() && Number(amount) > 0 && dueDate;

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
          <DialogTitle>{isEdit ? "Edit Commitment" : "Add Commitment"}</DialogTitle>
          <DialogDescription>Bills, subscriptions and other payments you know are coming.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="cm-title">Title</Label>
              <Input id="cm-title" placeholder="e.g. Internet bill" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cm-amount">Amount (৳)</Label>
              <Input id="cm-amount" type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cm-date">Due date</Label>
              <Input id="cm-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="cm-cat">Type</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="cm-cat" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>{k.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="col-span-2 flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">Recurring monthly</p>
                <p className="text-xs text-muted-foreground">Repeats every month on the same day.</p>
              </div>
              <Switch checked={recurring} onCheckedChange={setRecurring} />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <SubmitButton pending={pending} disabled={!isValid}>{isEdit ? "Save changes" : "Add commitment"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
