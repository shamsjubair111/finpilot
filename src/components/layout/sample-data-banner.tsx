"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/components/providers/finance-provider";
import { t } from "@/lib/i18n";

export function SampleDataBanner() {
  const { user, ledger, removeSampleData } = useFinance();
  const [busy, setBusy] = useState(false);
  if (!user.hasSampleData || ledger.ownerId !== user.id) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm">
      <FlaskConical className="size-4 text-violet-600 dark:text-violet-400" />
      <span className="flex-1">{t("You're exploring with sample data. Anything you add yourself stays when you remove it.")}</span>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await removeSampleData();
          setBusy(false);
        }}
      >
        {t("Remove sample data")}
      </Button>
    </div>
  );
}
