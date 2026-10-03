"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { api } from "@/lib/api-client";
import { t } from "@/lib/i18n";

/** Starts an email change; the switch happens when the link sent to the new address is opened. */
export function ChangeEmailDialog() {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Back from the confirmation link.
    const result = new URLSearchParams(window.location.search).get("email");
    if (!result) return;
    if (result === "changed") toast.success(t("Email changed"), { description: t("Use your new address next time you sign in.") });
    else if (result === "taken") toast.error(t("Couldn't change email"), { description: t("Another account already uses that email.") });
    else toast.error(t("Couldn't change email"), { description: t("The link is invalid or has expired. Please try again.") });
    window.history.replaceState(null, "", "/settings");
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await api("/profile/email", { method: "POST", body: { newEmail: email, password } });
      setSentTo(email);
      setPassword("");
    } catch (err) {
      toast.error(t("Couldn't change email"), { description: err instanceof Error ? err.message : undefined });
    } finally {
      setPending(false);
    }
  }

  function close(o: boolean) {
    setOpen(o);
    if (!o) {
      setSentTo(null);
      setEmail("");
      setPassword("");
    }
  }

  return (
    <>
      <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setOpen(true)}>
        {t("Change email")}
      </Button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="sm:max-w-sm">
          {sentTo ? (
            <>
              <DialogHeader>
                <DialogTitle>{t("Check your new inbox")}</DialogTitle>
                <DialogDescription>{t("We sent a link to {email}. Your email changes once you open it.", { email: sentTo })}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => close(false)}>{t("Done")}</Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>{t("Change email")}</DialogTitle>
                <DialogDescription>{t("We'll send a confirmation link to the new address.")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="new-email">{t("New email")}</Label>
                <Input id="new-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-password">{t("Current password")}</Label>
                <Input id="email-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => close(false)}>{t("Cancel")}</Button>
                <SubmitButton pending={pending} disabled={!email || !password}>{t("Send link")}</SubmitButton>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
