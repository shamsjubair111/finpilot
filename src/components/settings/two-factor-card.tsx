"use client";

import * as React from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Copy, Download, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { useFinance } from "@/components/providers/finance-provider";
import { api } from "@/lib/api-client";
import { t } from "@/lib/i18n";

type Stage = { name: "idle" } | { name: "scan"; secret: string; uri: string; qr: string } | { name: "codes"; codes: string[] } | { name: "disable" };

export function TwoFactorCard() {
  const { user, reloadUser } = useFinance();
  const [stage, setStage] = React.useState<Stage>({ name: "idle" });
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const enabled = !!user.twoFactorEnabled;

  async function run<T>(fn: () => Promise<T>, failure: string) {
    setPending(true);
    try {
      return await fn();
    } catch (err) {
      toast.error(t(failure), { description: err instanceof Error ? err.message : undefined });
      return null;
    } finally {
      setPending(false);
    }
  }

  async function start() {
    const res = await run(() => api<{ secret: string; uri: string }>("/auth/2fa/setup", { method: "POST" }), "Couldn't start setup");
    if (res) setStage({ name: "scan", ...res, qr: await QRCode.toDataURL(res.uri, { margin: 1, width: 200 }) });
  }

  async function enable(e: React.FormEvent) {
    e.preventDefault();
    const res = await run(() => api<{ recoveryCodes: string[] }>("/auth/2fa/enable", { method: "POST", body: { code } }), "Couldn't turn on two-step verification");
    if (!res) return;
    setCode("");
    setStage({ name: "codes", codes: res.recoveryCodes });
    toast.success(t("Two-step verification is on"));
    await reloadUser();
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    const res = await run(() => api("/auth/2fa/disable", { method: "POST", body: { password } }), "Couldn't turn off two-step verification");
    if (!res) return;
    setPassword("");
    setStage({ name: "idle" });
    toast.success(t("Two-step verification is off"));
    await reloadUser();
  }

  function saveCodes(codes: string[]) {
    const blob = new Blob([`Sanchay recovery codes for ${user.email}\n\n${codes.join("\n")}\n\nEach code works once.\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "sanchay-recovery-codes.txt" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="animate-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-muted-foreground" /> {t("Two-step verification")}
          {enabled && <Badge variant="secondary">{t("On")}</Badge>}
        </CardTitle>
        <CardDescription>{t("Ask for a code from an authenticator app (Google Authenticator, Authy…) when signing in.")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stage.name === "scan" ? (
          <form onSubmit={enable} className="space-y-4">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL generated in the browser */}
              <img src={stage.qr} alt={t("QR code for your authenticator app")} className="size-44 rounded-lg border bg-white p-1" />
              <div className="space-y-2 text-sm">
                <p>{t("1. Scan this QR code with your authenticator app.")}</p>
                <p className="text-muted-foreground">{t("Can't scan? Enter this key instead:")}</p>
                <p className="break-all rounded-md bg-muted px-2 py-1 font-mono text-xs">{stage.secret}</p>
                <a href={stage.uri} className="text-xs text-primary hover:underline">{t("Open in authenticator app")}</a>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tf-code">{t("2. Enter the 6-digit code it shows")}</Label>
              <Input id="tf-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} className="w-40 font-mono tracking-widest" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStage({ name: "idle" })}>{t("Cancel")}</Button>
              <SubmitButton pending={pending} disabled={code.trim().length !== 6}>{t("Turn on")}</SubmitButton>
            </div>
          </form>
        ) : stage.name === "codes" ? (
          <div className="space-y-3">
            <p className="text-sm">{t("Save these recovery codes somewhere safe. Each one lets you sign in once if you lose your phone. They won't be shown again.")}</p>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3 font-mono text-sm sm:grid-cols-5">
              {stage.codes.map((c) => <span key={c}>{c}</span>)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigator.clipboard.writeText(stage.codes.join("\n")).then(() => toast.success(t("Copied")))}>
                <Copy className="size-4" />{t("Copy")}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => saveCodes(stage.codes)}>
                <Download className="size-4" />{t("Download")}
              </Button>
              <Button size="sm" onClick={() => setStage({ name: "idle" })}>{t("I've saved them")}</Button>
            </div>
          </div>
        ) : stage.name === "disable" ? (
          <form onSubmit={disable} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="tf-password">{t("Confirm with your password")}</Label>
              <Input id="tf-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="max-w-xs" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStage({ name: "idle" })}>{t("Cancel")}</Button>
              <SubmitButton pending={pending} disabled={!password} className="bg-destructive text-white hover:bg-destructive/90">{t("Turn off")}</SubmitButton>
            </div>
          </form>
        ) : enabled ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t("{n} recovery codes left.", { n: user.recoveryCodesLeft ?? 0 })}</p>
            <Button variant="outline" onClick={() => setStage({ name: "disable" })}>{t("Turn off")}</Button>
          </div>
        ) : (
          <Button onClick={start} disabled={pending}>{t("Turn on two-step verification")}</Button>
        )}
      </CardContent>
    </Card>
  );
}
