"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ClipboardPaste, FileCheck2, MessageSquareText, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/components/providers/finance-provider";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import { t } from "@/lib/i18n";
import { parseSmsBatch, type ParsedSms } from "@/lib/sms-parser";
import type { ExpenseCategory, IncomeCategory } from "@/types/finance";

const NO_ACCOUNT = "__none__";

type Row = ParsedSms & { key: number; include: boolean; duplicate: boolean };

const SAMPLE = `You have received Tk 1,500.00 from 01712345678. Ref rent. Fee Tk 0.00. Balance Tk 3,250.50. TrxID 9IT4ABCD12 at 28/09/2026 14:35

Send Money Tk 500.00 to 01898765432 successful. Ref gift. Fee Tk 5.00. Balance Tk 2,745.50. TrxID 9IT5XYZ789 at 29/09/2026 09:10`;

export default function ImportPage() {
  return (
    <Suspense>
      <ImportView />
    </Suspense>
  );
}

function ImportView() {
  const router = useRouter();
  const params = useSearchParams();
  const { accounts, transactions, importTransactions } = useFinance();
  // Text shared from another app (PWA share target) arrives as ?text=… or ?title=….
  const [text, setText] = useState(() => [params.get("title"), params.get("text")].filter(Boolean).join("\n\n"));
  const [rows, setRows] = useState<Row[] | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [includeFees, setIncludeFees] = useState(true);
  const [accountId, setAccountId] = useState(NO_ACCOUNT);
  const [pending, setPending] = useState(false);

  const activeAccounts = accounts.filter((a) => !a.archived);
  const knownIds = useMemo(() => new Set(transactions.map((x) => x.externalId).filter(Boolean)), [transactions]);

  function parse() {
    const { parsed, skipped } = parseSmsBatch(text);
    setRows(parsed.map((p, i) => {
      const duplicate = !!p.txnId && knownIds.has(p.txnId);
      return { ...p, key: i, include: !duplicate, duplicate };
    }));
    setSkipped(skipped);
    // Pre-select a matching wallet when every message comes from one provider.
    const providers = new Set(parsed.map((p) => p.provider));
    if (accountId === NO_ACCOUNT && providers.size === 1) {
      const match = activeAccounts.find((a) => a.type === [...providers][0]);
      if (match) setAccountId(match.id);
    }
  }

  const update = (key: number, patch: Partial<Row>) => setRows((rs) => rs?.map((r) => (r.key === key ? { ...r, ...patch } : r)) ?? null);

  const selected = rows?.filter((r) => r.include) ?? [];
  const amountOf = (r: Row) => (includeFees && r.type === "expense" ? r.amount + r.fee : r.amount);

  async function submit() {
    setPending(true);
    const result = await importTransactions(
      selected.map((r) => ({
        title: r.title || t("Imported transaction"),
        merchant: r.counterparty.slice(0, 120),
        category: r.category,
        date: r.date,
        amount: Math.round(amountOf(r) * 100) / 100,
        type: r.type,
        paymentMethod: r.paymentMethod,
        notes: r.raw.slice(0, 500),
        accountId: accountId === NO_ACCOUNT ? null : accountId,
        externalId: r.txnId,
      }))
    );
    setPending(false);
    if (result) router.push("/transactions");
  }

  function reset() {
    setRows(null);
    setSkipped([]);
  }

  return (
    <div>
      <PageHeader
        title={t("Import from SMS")}
        subtitle={t("Paste bKash, Nagad, Rocket or bank SMS messages and turn them into transactions.")}
      />

      {!rows ? (
        <Card className="animate-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="size-5 text-primary" />
              {t("Paste your messages")}
            </CardTitle>
            <CardDescription>
              {t("Copy one or more messages from your SMS app. Leave a blank line between messages. Nothing is saved until you review and confirm.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={SAMPLE}
              className="min-h-56 font-mono text-xs"
              aria-label={t("SMS messages")}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={parse} disabled={!text.trim()} className="gap-1.5">
                <ClipboardPaste className="size-4" />
                {t("Read messages")}
              </Button>
              <Button variant="outline" onClick={() => setText(SAMPLE)}>
                {t("Try a sample")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Tip: on Android, install Sanchay to your home screen, then share an SMS to Sanchay to open it here.")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="animate-in-up">
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="import-account">{t("Account")}</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger id="import-account" className="w-full sm:w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_ACCOUNT}>{t("No account")}</SelectItem>
                      {activeAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 sm:pb-2">
                  <Switch id="import-fees" checked={includeFees} onCheckedChange={setIncludeFees} />
                  <Label htmlFor="import-fees">{t("Add fees to expenses")}</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={reset} className="gap-1.5">
                  <RotateCcw className="size-4" />
                  {t("Back")}
                </Button>
                <Button onClick={submit} disabled={!selected.length || pending} className="gap-1.5">
                  <FileCheck2 className="size-4" />
                  {t("Import {n} transactions", { n: selected.length })}
                </Button>
              </div>
            </CardContent>
          </Card>

          {rows.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {t("No transactions found in the pasted text. Check that each message includes an amount like “Tk 500”.")}
              </CardContent>
            </Card>
          )}

          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.key}>
                <Card className={r.include ? "" : "opacity-60"}>
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Switch checked={r.include} onCheckedChange={(v) => update(r.key, { include: v })} aria-label={t("Include")} />
                        <div>
                          <p className="font-medium">{r.title || t("Transaction")}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(r.date), "d MMM yyyy, h:mm a")}
                            {r.counterparty && ` · ${r.counterparty}`}
                            {r.txnId && ` · ${r.txnId}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold tabular-nums ${r.type === "income" ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                          {r.type === "income" ? "+" : "−"}
                          {formatCurrency(amountOf(r))}
                        </p>
                        {r.fee > 0 && <p className="text-xs text-muted-foreground">{t("Fee")} {formatCurrency(r.fee)}</p>}
                        {r.duplicate && <Badge variant="secondary" className="mt-1">{t("Already imported")}</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select value={r.type} onValueChange={(v) => update(r.key, { type: v as Row["type"], category: "Other" })}>
                        <SelectTrigger className="h-8 w-32" aria-label={t("Type")}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">{t("Expense")}</SelectItem>
                          <SelectItem value="income">{t("Income")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={r.category} onValueChange={(v) => update(r.key, { category: v as ExpenseCategory | IncomeCategory })}>
                        <SelectTrigger className="h-8 w-40" aria-label={t("Category")}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(r.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                            <SelectItem key={c} value={c}>{t(c)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          {skipped.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("{n} messages couldn't be read", { n: skipped.length })}</CardTitle>
                <CardDescription>{t("One-time codes and messages without an amount are ignored. You can add these by hand.")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {skipped.slice(0, 5).map((s, i) => (
                  <p key={i} className="truncate rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">{s}</p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
