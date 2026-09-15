"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { User, Coins, Target, Bell, Palette, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinance } from "@/components/providers/finance-provider";

export default function SettingsPage() {
  const { user, updateUser } = useFinance();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Standard next-themes SSR-safe pattern: `theme` is only meaningful once
    // mounted on the client, so this sync can't be expressed at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [salary, setSalary] = useState(String(user.monthlySalary));
  const [emergencyTarget, setEmergencyTarget] = useState(String(user.emergencyFundTarget));
  const [savingsTarget, setSavingsTarget] = useState(String(user.defaultSavingsTarget));

  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    goalMilestones: true,
    weeklySummary: false,
    purchaseTips: true,
  });

  function handleSaveProfile() {
    updateUser({ name, email });
    toast.success("Profile updated");
  }

  function handleSaveFinancialPrefs() {
    updateUser({
      monthlySalary: Number(salary) || user.monthlySalary,
      emergencyFundTarget: Number(emergencyTarget) || user.emergencyFundTarget,
      defaultSavingsTarget: Number(savingsTarget) || user.defaultSavingsTarget,
    });
    toast.success("Financial preferences saved");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" subtitle="Manage your profile, preferences, and app behavior." />

      {/* Profile */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            Profile
          </CardTitle>
          <CardDescription>Your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border border-border">
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                {name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Profile Photo</p>
              <p className="text-xs text-muted-foreground">Avatar uploads aren&apos;t available in this demo build.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">Full Name</Label>
              <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-email">Email</Label>
              <Input id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={handleSaveProfile}>
              <Save className="size-3.5" />
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="size-4 text-muted-foreground" />
            Currency
          </CardTitle>
          <CardDescription>Choose the currency used throughout the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="settings-currency">Display Currency</Label>
            <Select defaultValue="BDT">
              <SelectTrigger id="settings-currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BDT">৳ Bangladeshi Taka (BDT)</SelectItem>
                <SelectItem value="USD" disabled>$ US Dollar (coming soon)</SelectItem>
                <SelectItem value="EUR" disabled>€ Euro (coming soon)</SelectItem>
                <SelectItem value="GBP" disabled>£ British Pound (coming soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Financial Preferences */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-muted-foreground" />
            Financial Preferences
          </CardTitle>
          <CardDescription>Defaults used across dashboards and calculations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="settings-salary">Monthly Salary (৳)</Label>
              <Input id="settings-salary" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-ef-target">Emergency Fund Target (৳)</Label>
              <Input
                id="settings-ef-target"
                type="number"
                value={emergencyTarget}
                onChange={(e) => setEmergencyTarget(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-savings-target">Default Monthly Savings Target (৳)</Label>
              <Input
                id="settings-savings-target"
                type="number"
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={handleSaveFinancialPrefs}>
              <Save className="size-3.5" />
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-4 text-muted-foreground" />
            Theme
          </CardTitle>
          <CardDescription>Choose how FinPilot looks on your device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                suppressHydrationWarning
                className={`rounded-lg border p-3 text-center text-sm font-medium capitalize transition-colors ${
                  mounted && theme === t
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { key: "budgetAlerts" as const, label: "Budget alerts", desc: "Get notified when a category nears its limit." },
            { key: "goalMilestones" as const, label: "Goal milestones", desc: "Celebrate progress on your savings goals." },
            { key: "weeklySummary" as const, label: "Weekly summary", desc: "A digest of your spending each week." },
            { key: "purchaseTips" as const, label: "Purchase tips", desc: "Suggestions on when to buy wishlist items." },
          ].map((item, i, arr) => (
            <div key={item.key}>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key]}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                  }
                />
              </div>
              {i < arr.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
