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
import type { UserProfile } from "@/types/finance";

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
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLogin && password.length < 8) {
      toast.error("Password too short", { description: "Use at least 8 characters." });
      return;
    }
    setPending(true);
    try {
      const user = await api<UserProfile>(isLogin ? "/auth/login" : "/auth/register", {
        method: "POST",
        body: isLogin ? { email, password } : { name, email, password },
      });
      toast.success(isLogin ? `Welcome back, ${user.name.split(" ")[0]}!` : `Welcome aboard, ${user.name.split(" ")[0]}!`, {
        description: isLogin ? "You're signed in." : "Your account is ready. Start by setting your monthly income in Settings.",
      });
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : isLogin ? "/" : "/settings");
      router.refresh();
    } catch (err) {
      toast.error(isLogin ? "Sign in failed" : "Sign up failed", {
        description: err instanceof Error ? err.message : undefined,
      });
      setPending(false);
    }
  }

  return (
    <div className="glass animate-in-up rounded-3xl p-6 shadow-pop sm:p-8">
      <div className="mb-7 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLogin ? "Sign in to pick up where you left off." : "Start planning your finances in under a minute."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <Field id="name" label="Full name" icon={User}>
            <Input id="name" autoComplete="name" required className="h-11 pl-9" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}
        <Field id="email" label="Email" icon={Mail}>
          <Input id="email" type="email" autoComplete="email" required className="h-11 pl-9" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="password" label="Password" icon={Lock} hint={isLogin ? undefined : "At least 8 characters."}>
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
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </Field>

        <SubmitButton pending={pending} className="bg-gradient-brand glow-primary mt-2 h-11 w-full text-sm font-semibold text-white hover:brightness-110">
          {isLogin ? "Sign in" : "Create account"}
          {!pending && <ArrowRight className="size-4" />}
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isLogin ? "New to FinPilot? " : "Already have an account? "}
        <Link href={isLogin ? "/register" : "/login"} className="font-medium text-primary hover:underline">
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
