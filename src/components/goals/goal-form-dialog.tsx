"use client";

import * as React from "react";
import { toast } from "sonner";
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
import { GOAL_PRIORITIES } from "@/lib/constants";
import type { GoalPriority } from "@/types/finance";

const GOAL_CATEGORY_OPTIONS: { value: "emergency" | "purchase" | "education" | "travel" | "other"; label: string; icon: string; color: string }[] = [
  { value: "emergency", label: "Emergency Fund", icon: "ShieldCheck", color: "var(--chart-1)" },
  { value: "purchase", label: "Purchase", icon: "ShoppingBag", color: "var(--chart-2)" },
  { value: "education", label: "Education", icon: "GraduationCap", color: "var(--chart-3)" },
  { value: "travel", label: "Travel", icon: "Plane", color: "var(--chart-4)" },
  { value: "other", label: "Other", icon: "Target", color: "var(--chart-5)" },
];

export function GoalFormDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { addGoal } = useFinance();
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

  const isValid = name.trim() && goalAmount && Number(goalAmount) > 0 && targetDate && monthlyContribution;

  function resetForm() {
    setName("");
    setDescription("");
    setGoalAmount("");
    setCurrentAmount("");
    setTargetDate("");
    setMonthlyContribution("");
    setPriority("medium");
    setCategory("other");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    const categoryMeta = GOAL_CATEGORY_OPTIONS.find((c) => c.value === category)!;

    addGoal({
      name: name.trim(),
      description: description.trim() || undefined,
      icon: categoryMeta.icon,
      color: categoryMeta.color,
      goalAmount: Number(goalAmount),
      currentAmount: Number(currentAmount) || 0,
      targetDate,
      monthlyContribution: Number(monthlyContribution),
      priority,
      category,
    });

    toast.success("Goal created", { description: `${name.trim()} — target ৳${Number(goalAmount).toLocaleString()}` });
    resetForm();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Financial Goal</DialogTitle>
          <DialogDescription>Set a savings target and track your progress over time.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="goal-name">Goal Name</Label>
              <Input id="goal-name" placeholder="e.g. New Camera Fund" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-amount">Target Amount (৳)</Label>
              <Input id="goal-amount" type="number" min={0} value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-current">Current Saved (৳)</Label>
              <Input id="goal-current" type="number" min={0} value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-monthly">Monthly Contribution (৳)</Label>
              <Input id="goal-monthly" type="number" min={0} value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-date">Target Date</Label>
              <Input id="goal-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as GoalPriority)}>
                <SelectTrigger id="goal-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger id="goal-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="goal-description">Description (optional)</Label>
              <Textarea id="goal-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!isValid}>Create Goal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
