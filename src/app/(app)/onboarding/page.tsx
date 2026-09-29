"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Landmark, PiggyBank, Wallet } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/components/providers/finance-provider";
import { ACCOUNT_TYPE_META } from "@/lib/accounts";
import { getCurrencySymbol } from "@/lib/currency";
import { t } from "@/lib/i18n";
import type { AccountType } from "@/types/finance";

const STARTER_TYPES: AccountType[] = ["bank", "bkash", "nagad", "rocket", "cash", "credit_card", "savings"];

// Share of monthly income suggested for each starter budget.
const SUGGESTED_BUDGETS: { category: string; share: number }[] = [
  { category: "Housing", share: 0.3 },
  { category: "Food", share: 0.15 },
  { category: "Transport", share: 0.08 },
  { category: "Bills", share: 0.07 },
  { category: "Health", share: 0.05 },
  { category: "Shopping", share: 0.05 },
  { category: "Entertainment", share: 0.05 },
];

const toNumber = (v: string) => {
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const roundTo = (n: number, step: number) => Math.max(step, Math.round(n / step) * step);

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding } = useFinance();
  const symbol = getCurrencySymbol(user.currency);
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);

  const [salary, setSalary] = useState(user.monthlySalary ? String(user.monthlySalary) : "");
  const [savings, setSavings] = useState(user.currentSavings ? String(user.currentSavings) : "");

  const [addAccount, setAddAccount] = useState(true);
  const [accountType, setAccountType] = useState<AccountType>("bank");
  const [accountName, setAccountName] = useState("");
  const [balance, setBalance] = useState("");

  const [budgets, setBudgets] = useState<Record<string, { on: boolean; amount: string }>>({});
  const income = toNumber(salary);

  function goToBudgets() {
    // Fill suggestions from income the first time the step opens; keep any edits after that.
    if (!Object.keys(budgets).length) {
      const unit = income >= 10000 ? 500 : 10;
      setBudgets(Object.fromEntries(SUGGESTED_BUDGETS.map((b) => [b.category, { on: income > 0, amount: income > 0 ? String(roundTo(income * b.share, unit)) : "" }])));
    }
    setStep(2);
  }

  async function finish(skip = false) {
    setPending(true);
    const ok = await completeOnboarding(
      skip
        ? {}
        : {
            profile: { monthlySalary: income, currentSavings: toNumber(savings), emergencyFundTarget: income * 6 },
            account: addAccount
              ? { name: accountName.trim() || t(ACCOUNT_TYPE_META[accountType].label), type: accountType, openingBalance: toNumber(balance) }
              : undefined,
            budgets: Object.entries(budgets)
              .filter(([, b]) => b.on && toNumber(b.amount) > 0)
              .map(([category, b]) => ({ category, budgeted: toNumber(b.amount) })),
          }
    );
    if (ok) router.replace("/");
    else setPending(false);
  }

  const steps = [
    { icon: PiggyBank, label: t("Income") },
    { icon: Landmark, label: t("Account") },
    { icon: Wallet, label: t("Budget") },
  ];

  return (
    <div className="mx-auto max-w-xl py-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("Welcome, {name}!", { name: user.name.split(" ")[0] })}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("Three quick steps and your dashboard is ready.")}</p>
      </div>

      <ol className="mb-6 flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full border text-sm",
                i < step && "border-primary bg-primary text-primary-foreground",
                i === step && "border-primary text-primary"
              )}
            >
              {i < step ? <Check className="size-4" /> : <s.icon className="size-4" />}
            </span>
            <span className={cn("hidden text-sm sm:inline", i === step ? "font-medium" : "text-muted-foreground")}>{s.label}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
          </li>
        ))}
      </ol>

      <Card className="animate-in-up">
        {step === 0 && (
          <>
            <CardHeader>
              <CardTitle>{t("What comes in each month?")}</CardTitle>
              <CardDescription>{t("Your take-home income powers budgets, goals and affordability checks. You can change it any time.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ob-salary">{t("Monthly income")} ({symbol})</Label>
                <Input id="ob-salary" inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="50000" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-savings">{t("Current savings")} ({symbol})</Label>
                <Input id="ob-savings" inputMode="decimal" value={savings} onChange={(e) => setSavings(e.target.value)} placeholder="0" />
              </div>
            </CardContent>
          </>
        )}

        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>{t("Add your main account")}</CardTitle>
              <CardDescription>{t("Where does your money usually sit? You can add more accounts later.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch id="ob-add-account" checked={addAccount} onCheckedChange={setAddAccount} />
                <Label htmlFor="ob-add-account">{t("Add an account now")}</Label>
              </div>
              {addAccount && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-type">{t("Type")}</Label>
                    <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
                      <SelectTrigger id="ob-type" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STARTER_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{t(ACCOUNT_TYPE_META[type].label)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-name">{t("Name")}</Label>
                    <Input id="ob-name" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder={t(ACCOUNT_TYPE_META[accountType].label)} maxLength={60} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-balance">{t("Current balance")} ({symbol})</Label>
                    <Input id="ob-balance" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" />
                  </div>
                </>
              )}
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>{t("Set a starter budget")}</CardTitle>
              <CardDescription>
                {income > 0
                  ? t("Suggested from your income. Adjust the amounts or switch off what you don't need.")
                  : t("Turn on the categories you want to track and enter a monthly amount.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {SUGGESTED_BUDGETS.map(({ category }) => {
                const b = budgets[category] ?? { on: false, amount: "" };
                const set = (patch: Partial<typeof b>) => setBudgets((prev) => ({ ...prev, [category]: { ...b, ...patch } }));
                return (
                  <div key={category} className="flex items-center gap-3">
                    <Switch checked={b.on} onCheckedChange={(on) => set({ on })} aria-label={t(category)} />
                    <span className="flex-1 text-sm">{t(category)}</span>
                    <Input
                      inputMode="decimal"
                      value={b.amount}
                      onChange={(e) => set({ amount: e.target.value, on: true })}
                      className="h-9 w-32 text-right"
                      aria-label={t("{category} budget", { category: t(category) })}
                      placeholder="0"
                    />
                  </div>
                );
              })}
            </CardContent>
          </>
        )}

        <CardContent className="flex items-center justify-between gap-2 border-t pt-4">
          {step === 0 ? (
            <Button variant="ghost" onClick={() => finish(true)} disabled={pending}>{t("Skip setup")}</Button>
          ) : (
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={pending} className="gap-1.5">
              <ArrowLeft className="size-4" />
              {t("Back")}
            </Button>
          )}
          {step < 2 ? (
            <Button onClick={() => (step === 0 ? setStep(1) : goToBudgets())} className="gap-1.5">
              {t("Continue")}
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={() => finish()} disabled={pending} className="gap-1.5">
              <Check className="size-4" />
              {t("Finish setup")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
