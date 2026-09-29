"use client";

import * as React from "react";
import { toast } from "sonner";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/components/providers/finance-provider";
import { compressImage } from "@/lib/image-compress";
import { isOfflineId } from "@/lib/outbox";
import { t } from "@/lib/i18n";

/** Attach, view or remove the receipt photo of a saved transaction. */
export function ReceiptField({ transactionId }: { transactionId: string }) {
  const { transactions, setReceiptFlag, readOnly } = useFinance();
  const has = !!transactions.find((x) => x.id === transactionId)?.hasReceipt;
  const [busy, setBusy] = React.useState(false);
  const [version, setVersion] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  if (isOfflineId(transactionId)) return null;
  const url = `/api/transactions/${transactionId}/receipt?v=${version}`;

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const blob = await compressImage(file);
      const res = await fetch(`/api/transactions/${transactionId}/receipt`, { method: "PUT", body: blob, headers: { "Content-Type": "image/jpeg" } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Upload failed (${res.status})`);
      setReceiptFlag(transactionId, true);
      setVersion((v) => v + 1);
      toast.success(t("Receipt attached"));
    } catch (err) {
      toast.error(t("Couldn't attach receipt"), { description: err instanceof Error ? err.message : undefined });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/transactions/${transactionId}/receipt`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return void toast.error(t("Couldn't remove receipt"));
    setReceiptFlag(transactionId, false);
    toast.success(t("Receipt removed"));
  }

  return (
    <div className="space-y-1.5">
      <Label>{t("Receipt")}</Label>
      {has ? (
        <div className="flex items-start gap-3">
          <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element -- authenticated API image */}
            <img src={url} alt={t("Receipt")} className="h-24 w-20 object-cover" />
          </a>
          {!readOnly && (
            <div className="flex flex-col gap-1">
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>{t("Replace")}</Button>
              <Button type="button" variant="ghost" size="sm" className="gap-1" disabled={busy} onClick={remove}>
                <Trash2 className="size-3.5" />
                {t("Remove")}
              </Button>
            </div>
          )}
        </div>
      ) : readOnly ? (
        <p className="text-xs text-muted-foreground">{t("No receipt")}</p>
      ) : (
        <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {t("Add receipt photo")}
        </Button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
}
