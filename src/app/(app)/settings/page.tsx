"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { AlertTriangle, KeyRound, Laptop, LogOut, Moon, Palette, Sun, Target, User } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useFinance } from "@/components/providers/finance-provider";
import { cn } from "cn";

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
  const { user, updateUser, changePassword, deleteAccount, signOut } = useFinance();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // next-themes only knows the theme after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
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
    await updateUser({ name: name.trim(), email: email.trim(), avatarUrl: avatarUrl.trim() || undefined }, "Profile updated");
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
    const ok = await deleteAccount(deletePassword);
    setDeletePending(false);
    if (!ok) setDeletePassword("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" subtitle={`Member since ${format(new Date(user.memberSince), "MMMM yyyy")}`} />

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
              <User className="size-4 text-muted-foreground" /> Profile
            </CardTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="settings-name">Full name</Label>
                <Input id="settings-name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-email">Email</Label>
                <Input id="settings-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="settings-avatar">Avatar image URL (optional)</Label>
                <Input id="settings-avatar" type="url" placeholder="https://…" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <SubmitButton pending={profilePending} disabled={!name.trim() || !email.trim()}>Save profile</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Financial profile */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-muted-foreground" /> Financial profile
          </CardTitle>
          <CardDescription>Used across your dashboard, affordability checks and Scenario Lab.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePrefs} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MoneyField id="s-salary" label="Monthly income (৳)" value={salary} onChange={setSalary} hint="Used when no income is recorded for the month." />
              <MoneyField id="s-savings" label="Current savings (৳)" value={currentSavings} onChange={setCurrentSavings} />
              <MoneyField id="s-ef-current" label="Emergency fund — saved (৳)" value={efCurrent} onChange={setEfCurrent} />
              <MoneyField id="s-ef-target" label="Emergency fund — target (৳)" value={efTarget} onChange={setEfTarget} hint="3–6 months of expenses is a common target." />
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="s-pct">Savings target (% of income)</Label>
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
              <SubmitButton pending={prefsPending}>Save financial profile</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-4 text-muted-foreground" /> Appearance
          </CardTitle>
          <CardDescription>Choose how FinPilot looks on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid max-w-md grid-cols-3 gap-3">
            {([
              { t: "light", icon: Sun },
              { t: "dark", icon: Moon },
              { t: "system", icon: Laptop },
            ] as const).map(({ t, icon: Icon }) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                suppressHydrationWarning
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium capitalize transition-all",
                  mounted && theme === t ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "border-border hover:-translate-y-0.5 hover:bg-muted/50"
                )}
              >
                <Icon className="size-4" />
                {t}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" /> Security
          </CardTitle>
          <CardDescription>Change your password. You&apos;ll stay signed in on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pw-current">Current password</Label>
                <Input id="pw-current" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw-new">New password</Label>
                <Input id="pw-new" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <p className="text-xs text-muted-foreground">At least 8 characters.</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <Button type="button" variant="outline" className="gap-1.5" onClick={signOut}>
                <LogOut className="size-3.5" /> Sign out
              </Button>
              <SubmitButton pending={pwPending} disabled={!currentPassword || newPassword.length < 8}>Update password</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="animate-in-up border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" /> Danger zone
          </CardTitle>
          <CardDescription>Permanently delete your account and every transaction, budget, goal and commitment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete account</Button>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={(o) => !deletePending && setDeleteOpen(o)}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={confirmDelete} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>This can&apos;t be undone. Enter your password to confirm.</DialogDescription>
            </DialogHeader>
            <Input type="password" autoComplete="current-password" placeholder="Password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} autoFocus />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deletePending}>Cancel</Button>
              <SubmitButton pending={deletePending} disabled={!deletePassword} className="bg-destructive text-white hover:bg-destructive/90">
                Delete forever
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
