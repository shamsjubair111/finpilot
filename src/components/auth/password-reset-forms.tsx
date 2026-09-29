"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Lock, Mail, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { api } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="glass animate-in-up rounded-3xl p-6 shadow-pop sm:p-8">
      <div className="mb-7 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" />
          {t("Back to sign in")}
        </Link>
      </p>
    </div>
  );
}

const inputClass = "h-11 pl-9";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await api("/auth/forgot", { method: "POST", body: { email } });
      setSent(true);
    } catch (err) {
      toast.error(t("Couldn't send reset email"), { description: err instanceof Error ? err.message : undefined });
    } finally {
      setPending(false);
    }
  }

  if (sent)
    return (
      <Shell title={t("Check your email")} subtitle={t("If an account exists for {email}, we've sent a link to reset your password. It expires in 1 hour.", { email })}>
        <div className="flex justify-center py-4 text-primary">
          <MailCheck className="size-12" />
        </div>
      </Shell>
    );

  return (
    <Shell title={t("Forgot your password?")} subtitle={t("Enter your email and we'll send you a link to choose a new one.")}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("Email")}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoFocus />
          </div>
        </div>
        <SubmitButton pending={pending} disabled={!email} className="h-11 w-full">
          {t("Send reset link")}
        </SubmitButton>
      </form>
    </Shell>
  );
}

export function ResetPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return void toast.error(t("Password too short"), { description: t("Use at least 8 characters.") });
    if (password !== confirm) return void toast.error(t("Passwords don't match"));
    setPending(true);
    try {
      await api("/auth/reset", { method: "POST", body: { token, password } });
      toast.success(t("Password updated"), { description: t("Sign in with your new password.") });
      router.replace("/login");
    } catch (err) {
      toast.error(t("Couldn't reset password"), { description: err instanceof Error ? err.message : undefined });
      setPending(false);
    }
  }

  if (!token)
    return (
      <Shell title={t("Link not valid")} subtitle={t("This reset link is incomplete. Request a new one to continue.")}>
        <Link href="/forgot-password" className="block text-center text-sm font-medium text-primary hover:underline">
          {t("Request a new link")}
        </Link>
      </Shell>
    );

  return (
    <Shell title={t("Choose a new password")} subtitle={t("Use at least 8 characters.")}>
      <form onSubmit={submit} className="space-y-4">
        {[
          { id: "password", label: t("New password"), value: password, set: setPassword },
          { id: "confirm", label: t("Confirm new password"), value: confirm, set: setConfirm },
        ].map((f) => (
          <div key={f.id} className="space-y-1.5">
            <Label htmlFor={f.id}>{f.label}</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id={f.id} type="password" autoComplete="new-password" required value={f.value} onChange={(e) => f.set(e.target.value)} className={inputClass} />
            </div>
          </div>
        ))}
        <SubmitButton pending={pending} disabled={!password || !confirm} className="h-11 w-full">
          {t("Update password")}
        </SubmitButton>
      </form>
    </Shell>
  );
}
