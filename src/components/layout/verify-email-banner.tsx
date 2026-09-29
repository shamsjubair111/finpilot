"use client";

import { useState } from "react";
import { MailWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/components/providers/finance-provider";
import { t } from "@/lib/i18n";

export function VerifyEmailBanner() {
  const { user, resendVerification } = useFinance();
  const [hidden, setHidden] = useState(false);
  const [sending, setSending] = useState(false);
  if (user.emailVerified || hidden) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <MailWarning className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="flex-1">{t("Please confirm {email} so you can recover your account if you forget your password.", { email: user.email })}</p>
      <Button
        size="sm"
        variant="outline"
        disabled={sending}
        onClick={async () => {
          setSending(true);
          await resendVerification();
          setSending(false);
        }}
      >
        {t("Resend email")}
      </Button>
      <button type="button" onClick={() => setHidden(true)} className="text-muted-foreground hover:text-foreground" aria-label={t("Dismiss")}>
        <X className="size-4" />
      </button>
    </div>
  );
}
