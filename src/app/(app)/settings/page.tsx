"use client";

import { getCurrencySymbol } from "@/lib/currency";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { formatDate } from "@/lib/format-date";
import { AlertTriangle, Download, Globe2, Mail, KeyRound, Laptop, Lock, LogOut, Moon, Palette, Sun, Target, User } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { TwoFactorCard } from "@/components/settings/two-factor-card";
import { useFinance } from "@/components/providers/finance-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currency";
import { LANGS, getLang } from "@/lib/i18n";
import type { Currency } from "@/types/finance";
import { cn } from "cn";
import { t } from "@/lib/i18n";

function MoneyField({ id, label, value, onChange, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" min={0} step="any" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser, changePassword, deleteUserAccount, signOut, signOutOtherDevices, setLanguage } = useFinance();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // next-themes only knows the theme after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [profilePending, setProfilePending] = useState(false);

  const [salary, setSalary] = useState(String(user.monthlySalary || ""));
  const [currentSavings, setCurrentSavings] = useState(String(user.currentSavings || ""));
  const [efCurrent, setEfCurrent] = useState(String(user.emergencyFundCurrent || ""));
  const [efTarget, setEfTarget] = useState(String(user.emergencyFundTarget || ""));
  const [savingsPct, setSavingsPct] = useState(String(user.defaultSavingsTarget));
  const [prefsPending, setPrefsPending] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwPending, setPwPending] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePending, setDeletePending] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfilePending(true);
    await updateUser({ name: name.trim(), avatarUrl: avatarUrl.trim() || undefined }, "Profile updated");
    setProfilePending(false);
  }

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    setPrefsPending(true);
    await updateUser(
      {
        monthlySalary: Number(salary) || 0,
        currentSavings: Number(currentSavings) || 0,
        emergencyFundCurrent: Number(efCurrent) || 0,
        emergencyFundTarget: Number(efTarget) || 0,
        defaultSavingsTarget: Math.min(100, Math.max(0, Number(savingsPct) || 0)),
      },
      "Financial profile saved"
    );
    setPrefsPending(false);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwPending(true);
    if (await changePassword(currentPassword, newPassword)) {
      setCurrentPassword("");
      setNewPassword("");
    }
    setPwPending(false);
  }

  async function confirmDelete(e: React.FormEvent) {
    e.preventDefault();
    setDeletePending(true);
    const ok = await deleteUserAccount(deletePassword);
    setDeletePending(false);
    if (!ok) setDeletePassword("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t("Settings")} subtitle={t("Member since {date}", { date: formatDate(user.memberSince, "MMMM yyyy") })} />

      {/* Profile */}
      <Card className="animate-in-up overflow-hidden">
        <div className="bg-mesh-hero relative h-20 sm:h-24">
          <div className="grid-lines absolute inset-0 opacity-60" />
        </div>
        <CardContent className="-mt-12 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Avatar className="size-20 border-4 border-card shadow-card">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
              <AvatarFallback className="bg-gradient-brand text-xl font-semibold text-white">
                {name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 pb-1">
              <p className="truncate text-lg font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4 text-muted-foreground" /> {t("Profile")}
            </CardTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="settings-name">{t("Full name")}</Label>
                <Input id="settings-name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-email">{t("Email")}</Label>
                <div className="relative">
                  <Input id="settings-email" type="email" value={user.email} readOnly disabled className="pr-9" />
                  <Lock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">{t("Your sign-in email is permanent and can't be changed.")}</p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="settings-avatar">{t("Avatar image URL (optional)")}</Label>
                <Input id="settings-avatar" type="url" placeholder="https://…" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <SubmitButton pending={profilePending} disabled={!name.trim()}>{t("Save profile")}</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Language & currency */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="size-4 text-muted-foreground" /> {t("Language & currency")}
          </CardTitle>
          <CardDescription>{t("Sanchay works in English and বাংলা, with any major currency.")}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("Language")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => l.value !== getLang() && setLanguage(l.value)}
                  className={cn(
                    "rounded-xl border p-3 text-sm font-medium transition-all",
                    getLang() === l.value ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "border-border hover:-translate-y-0.5 hover:bg-muted/50"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-currency">{t("Currency")}</Label>
            <Select value={user.currency} onValueChange={(v) => updateUser({ currency: v as Currency }, "Currency updated")}>
              <SelectTrigger id="settings-currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="w-9 font-semibold">{c.symbol.trim()}</span>
                    {getLang() === "bn" ? c.bnName : c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("Amounts aren't converted — only the symbol and format change.")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Financial profile */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-muted-foreground" /> {t("Financial profile")}
          </CardTitle>
          <CardDescription>{t("Used across your dashboard, affordability checks and Scenario Lab.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePrefs} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MoneyField id="s-salary" label={`${t("Monthly income")} (${getCurrencySymbol()})`} value={salary} onChange={setSalary} hint={t("Used when no income is recorded for the month.")} />
              <MoneyField id="s-savings" label={`${t("Current savings")} (${getCurrencySymbol()})`} value={currentSavings} onChange={setCurrentSavings} />
              <MoneyField id="s-ef-current" label={`${t("Emergency fund — saved")} (${getCurrencySymbol()})`} value={efCurrent} onChange={setEfCurrent} />
              <MoneyField id="s-ef-target" label={`${t("Emergency fund — target")} (${getCurrencySymbol()})`} value={efTarget} onChange={setEfTarget} hint={t("3–6 months of expenses is a common target.")} />
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="s-pct">{t("Savings target (% of income)")}</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="s-pct"
                    type="range"
                    min={0}
                    max={80}
                    step={1}
                    value={savingsPct}
                    onChange={(e) => setSavingsPct(e.target.value)}
                    className="h-2 flex-1 cursor-pointer accent-[var(--primary)]"
                  />
                  <span className="w-12 text-right text-sm font-semibold tabular-nums">{savingsPct}%</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <SubmitButton pending={prefsPending}>{t("Save financial profile")}</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-4 text-muted-foreground" /> {t("Appearance")}
          </CardTitle>
          <CardDescription>{t("Choose how Sanchay looks on this device.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid max-w-md grid-cols-3 gap-3">
            {([
              { mode: "light", icon: Sun },
              { mode: "dark", icon: Moon },
              { mode: "system", icon: Laptop },
            ] as const).map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                suppressHydrationWarning
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium capitalize transition-all",
                  mounted && theme === mode ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "border-border hover:-translate-y-0.5 hover:bg-muted/50"
                )}
              >
                <Icon className="size-4" />
                {t(mode)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" /> {t("Emails")}
          </CardTitle>
          <CardDescription>{t("Account and security emails are always sent.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{t("Weekly summary")}</p>
              <p className="text-xs text-muted-foreground">{t("A short Monday email with last week's spending, budgets and upcoming bills.")}</p>
            </div>
            <Switch
              checked={user.weeklySummary ?? true}
              onCheckedChange={(v) => updateUser({ weeklySummary: v }, v ? "Weekly summary on" : "Weekly summary off")}
            />
          </label>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" /> {t("Security")}
          </CardTitle>
          <CardDescription>{t("Change your password. You'll stay signed in on this device.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pw-current">{t("Current password")}</Label>
                <Input id="pw-current" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw-new">{t("New password")}</Label>
                <Input id="pw-new" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <p className="text-xs text-muted-foreground">{t("At least 8 characters.")}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="gap-1.5" onClick={signOut}>
                  <LogOut className="size-3.5" /> {t("Sign out")}
                </Button>
                <Button type="button" variant="ghost" onClick={signOutOtherDevices}>
                  {t("Sign out other devices")}
                </Button>
              </div>
              <SubmitButton pending={pwPending} disabled={!currentPassword || newPassword.length < 8}>{t("Update password")}</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <TwoFactorCard />

      {/* Data export */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="size-4" /> {t("Your data")}
          </CardTitle>
          <CardDescription>{t("Download a copy of everything you've saved in Sanchay.")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/api/export?format=csv" download>{t("Transactions (CSV)")}</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/export" download>{t("Everything (JSON)")}</a>
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="animate-in-up border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" /> {t("Danger zone")}
          </CardTitle>
          <CardDescription>{t("Permanently delete your account and every transaction, budget, goal and commitment.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>{t("Delete account")}</Button>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={(o) => !deletePending && setDeleteOpen(o)}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={confirmDelete} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{t("Delete your account?")}</DialogTitle>
              <DialogDescription>{t("This can't be undone. Enter your password to confirm.")}</DialogDescription>
            </DialogHeader>
            <Input type="password" autoComplete="current-password" placeholder={t("Password")} value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} autoFocus />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deletePending}>{t("Cancel")}</Button>
              <SubmitButton pending={deletePending} disabled={!deletePassword} className="bg-destructive text-white hover:bg-destructive/90">
                {t("Delete forever")}
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
