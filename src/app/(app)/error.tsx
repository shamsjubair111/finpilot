"use client";

import { t } from "@/lib/i18n";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    // Best-effort report so crashes show up in the admin dashboard.
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `${error.message}${error.digest ? ` (digest ${error.digest})` : ""}`.slice(0, 500), stack: error.stack?.slice(0, 4000), path: window.location.pathname }),
    }).catch(() => {});
  }, [error]);

  return (
    <ErrorState
      title={t("Something went wrong")}
      description={t("An unexpected error occurred while loading this page. Please try again.")}
      onRetry={reset}
    />
  );
}
