"use client";

import { formatCurrency, getCurrencySymbol } from "@/lib/currency";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinance } from "@/components/providers/finance-provider";
import { SubmitButton } from "@/components/shared/submit-button";
import { isLiability } from "@/lib/accounts";
import { GOAL_PRIORITIES } from "@/lib/constants";
import type { FinancialGoal, GoalPriority } from "@/types/finance";
import { t } from "@/lib/i18n";

const GOAL_CATEGORY_OPTIONS: { value: "emergency" | "purchase" | "education" | "travel" | "other"; label: string; icon: string; color: string }[] = [
  { value: "emergency", label: "Emergency Fund", icon: "ShieldCheck", color: "var(--chart-1)" },
  { value: "purchase", label: "Purchase", icon: "ShoppingBag", color: "var(--chart-2)" },
  { value: "education", label: "Education", icon: "GraduationCap", color: "var(--chart-3)" },
  { value: "travel", label: "Travel", icon: "Plane", color: "var(--chart-4)" },
  { value: "other", label: "Other", icon: "Target", color: "var(--chart-5)" },
];

const NO_ACCOUNT = "__none__";

export function GoalFormDialog({
  goal,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  goal?: FinancialGoal | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { addGoal, updateGoal, accounts, accountBaseBalances } = useFinance();
  const savingAccounts = accounts.filter((a) => !a.archived && !isLiability(a.type));
  const [accountId, setAccountId] = React.useState(NO_ACCOUNT);
  const isEdit = !!goal;
  const [pending, setPending] = React.useState(false);
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [goalAmount, setGoalAmount] = React.useState("");
  const [currentAmount, setCurrentAmount] = React.useState("");
  const [targetDate, setTargetDate] = React.useState("");
  const [monthlyContribution, setMonthlyContribution] = React.useState("");
  const [priority, setPriority] = React.useState<GoalPriority>("medium");
  const [category, setCategory] = React.useState<(typeof GOAL_CATEGORY_OPTIONS)[number]["value"]>("other");

  const isValid = name.trim() && goalAmount && Number(goalAmount) > 0 && targetDate;

  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setName(goal?.name ?? "");
    setDescription(goal?.description ?? "");
    setGoalAmount(goal ? String(goal.goalAmount) : "");
    setCurrentAmount(goal ? String(goal.currentAmount) : "");
    setAccountId(goal?.accountId ?? NO_ACCOUNT);
    setTargetDate(goal ? goal.targetDate.slice(0, 10) : "");
    setMonthlyContribution(goal ? String(goal.monthlyContribution) : "");
    setPriority(goal?.priority ?? "medium");
    setCategory(goal?.category ?? "other");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setPending(true);
    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      icon: GOAL_CATEGORY_OPTIONS.find((c) => c.value === category)!.icon,
      color: GOAL_CATEGORY_OPTIONS.find((c) => c.value === category)!.color,
      goalAmount: Number(goalAmount),
      currentAmount: Number(currentAmount) || 0,
      accountId: accountId === NO_ACCOUNT ? null : accountId,
      targetDate,
      monthlyContribution: Number(monthlyContribution) || 0,
      priority,
      category,
    };
    const ok = isEdit ? await updateGoal(goal!.id, data) : await addGoal(data);
    setPending(false);
    if (ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("Edit Goal") : t("Add Financial Goal")}</DialogTitle>
          <DialogDescription>{t("Set a savings target and track your progress over time.")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="goal-name">{t("Goal Name")}</Label>
              <Input id="goal-name" placeholder={t("e.g. New Camera Fund")} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-amount">{`${t("Target Amount")} (${getCurrencySymbol()})`}</Label>
              <Input id="goal-amount" type="number" min={0} step="any" inputMode="decimal" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-account">{t("Track with an account")}</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="goal-account" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ACCOUNT}>{t("No, I'll update it myself")}</SelectItem>
                  {savingAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-current">{`${t("Current Saved")} (${getCurrencySymbol()})`}</Label>
              {accountId === NO_ACCOUNT ? (
                <Input id="goal-current" type="number" min={0} step="any" inputMode="decimal" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
              ) : (
                <p className="flex h-9 items-center rounded-lg border bg-muted px-3 text-sm text-muted-foreground">
                  {t("Follows the balance: {amount}", { amount: formatCurrency(Math.max(0, accountBaseBalances.get(accountId) ?? 0)) })}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-monthly">{`${t("Monthly Contribution")} (${getCurrencySymbol()})`}</Label>
              <Input id="goal-monthly" type="number" min={0} step="any" inputMode="decimal" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-date">{t("Target Date")}</Label>
              <Input id="goal-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-priority">{t("Priority")}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as GoalPriority)}>
                <SelectTrigger id="goal-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{t(p.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-category">{t("Category")}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger id="goal-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{t(c.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="goal-description">{t("Description (optional)")}</Label>
              <Textarea id="goal-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("Cancel")}</Button>
            <SubmitButton pending={pending} disabled={!isValid}>{isEdit ? t("Save changes") : t("Create Goal")}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
