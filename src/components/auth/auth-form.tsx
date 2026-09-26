"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { api } from "@/lib/api-client";
import type { Currency, UserProfile } from "@/types/finance";
import { useI18n } from "@/lib/i18n/provider";
import { CURRENCIES } from "@/lib/currency";

const TZ_CURRENCY: Record<string, Currency> = {
  "Asia/Dhaka": "BDT", "Asia/Kolkata": "INR", "Asia/Calcutta": "INR", "Europe/London": "GBP", "Asia/Dubai": "AED",
  "Asia/Riyadh": "SAR", "Asia/Kuala_Lumpur": "MYR", "Asia/Singapore": "SGD", "Asia/Tokyo": "JPY",
};
function guessCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TZ_CURRENCY[tz]) return TZ_CURRENCY[tz];
    if (tz.startsWith("Europe/")) return "EUR";
    if (tz.startsWith("Australia/")) return "AUD";
    if (tz.startsWith("America/Toronto") || tz.startsWith("America/Vancouver")) return "CAD";
    return tz.startsWith("America/") ? "USD" : "USD";
  } catch {
    return "USD";
  }
}

function Field({
  id,
  label,
  icon: Icon,
  children,
  hint,
}: {
  id: string;
  label: string;
  icon: typeof Mail;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { t, lang } = useI18n();
  const [currency, setCurrency] = React.useState<Currency>("BDT");
  React.useEffect(() => {
    // Timezone is only known in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrency(guessCurrency());
  }, []);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLogin && password.length < 8) {
      toast.error(t("Password too short"), { description: t("Use at least 8 characters.") });
      return;
    }
    setPending(true);
    try {
      const user = await api<UserProfile>(isLogin ? "/auth/login" : "/auth/register", {
        method: "POST",
        body: isLogin ? { email, password } : { name, email, password, language: lang, currency },
      });
      toast.success(t(isLogin ? "Welcome back, {name}!" : "Welcome aboard, {name}!", { name: user.name.split(" ")[0] }), {
        description: t(isLogin ? "You're signed in." : "Your account is ready. Start by setting your monthly income in Settings."),
      });
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : isLogin ? "/" : "/settings");
      router.refresh();
    } catch (err) {
      toast.error(t(isLogin ? "Sign in failed" : "Sign up failed"), {
        description: err instanceof Error ? err.message : undefined,
      });
      setPending(false);
    }
  }

  return (
    <div className="glass animate-in-up rounded-3xl p-6 shadow-pop sm:p-8">
      <div className="mb-7 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t(isLogin ? "Welcome back" : "Create your account")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(isLogin ? "Sign in to pick up where you left off." : "Start planning your finances in under a minute.")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <Field id="name" label={t("Full name")} icon={User}>
            <Input id="name" autoComplete="name" required className="h-11 pl-9" placeholder={t("Your name")} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}
        <Field id="email" label={t("Email")} icon={Mail}>
          <Input id="email" type="email" autoComplete="email" required className="h-11 pl-9" placeholder={t("you@example.com")} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="password" label={t("Password")} icon={Lock} hint={isLogin ? undefined : t("At least 8 characters.")}>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            className="h-11 px-9"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={t(showPassword ? "Hide password" : "Show password")}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </Field>

        {!isLogin && (
          <div className="space-y-1.5">
            <label htmlFor="currency" className="text-sm font-medium">{t("Currency")}</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol.trim()} · {lang === "bn" ? c.bnName : c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        )}

        <SubmitButton pending={pending} className="bg-gradient-brand glow-primary mt-2 h-11 w-full text-sm font-semibold text-white hover:brightness-110">
          {t(isLogin ? "Sign in" : "Create account")}
          {!pending && <ArrowRight className="size-4" />}
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t(isLogin ? "New to Sanchay?" : "Already have an account?")}{" "}
        <Link href={isLogin ? "/register" : "/login"} className="font-medium text-primary hover:underline">
          {t(isLogin ? "Create an account" : "Sign in")}
        </Link>
      </p>
    </div>
  );
}
