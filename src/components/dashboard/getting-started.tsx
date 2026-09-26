"use client";

import Link from "next/link";
import { Check, ChevronRight, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useFinance } from "@/components/providers/finance-provider";
import { cn } from "cn";

export function GettingStarted() {
  const { user, transactions, budgetCategories, goals, commitments } = useFinance();
  const steps = [
    { done: user.monthlySalary > 0, label: "Set your monthly income & savings", href: "/settings" },
    { done: transactions.length > 0, label: "Record your first transaction", href: "/transactions" },
    { done: budgetCategories.length > 0, label: "Create a budget category", href: "/budget" },
    { done: goals.length > 0, label: "Add a savings goal", href: "/goals" },
    { done: commitments.length > 0, label: "Add an upcoming bill", href: "/#commitments" },
  ];
  const completed = steps.filter((s) => s.done).length;
  if (completed === steps.length) return null;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <Card className="relative mb-6 overflow-hidden border-primary/20 p-5 animate-in-up sm:p-6">
      <div className="orb -right-10 -top-16 size-56 bg-primary/30" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex items-center gap-4 md:w-72 md:shrink-0">
          <div className="bg-gradient-brand glow-primary flex size-12 shrink-0 items-center justify-center rounded-2xl text-white">
            <Rocket className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Get set up</p>
            <p className="text-sm text-muted-foreground">{completed} of {steps.length} done</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="bg-gradient-brand h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
        <ul className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {steps.map((s) => (
            <li key={s.label}>
              <Link
                href={s.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-all",
                  s.done ? "border-success/30 bg-success/5 text-muted-foreground line-through" : "border-border bg-background/60 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
                )}
              >
                <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border", s.done ? "border-success bg-success text-white" : "border-muted-foreground/40")}>
                  {s.done && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="flex-1">{s.label}</span>
                {!s.done && <ChevronRight className="size-4 text-muted-foreground" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
