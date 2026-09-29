"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, FileSpreadsheet, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/components/providers/finance-provider";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/format-date";
import { t } from "@/lib/i18n";
import { detectColumns, parseCsv, rowsToTransactions, type ColumnMapping, type CsvTransaction } from "@/lib/csv-import";
import type { ExpenseCategory, IncomeCategory } from "@/types/finance";
import { buildCategoryModel, suggestCategory } from "@/lib/categorize";

const NONE = "-1";
const NO_ACCOUNT = "__none__";
const MAX_BYTES = 2 * 1024 * 1024;
const BATCH = 500;
const PREVIEW_LIMIT = 200;

type Row = CsvTransaction & { key: number; include: boolean; duplicate: boolean };

export function CsvImport() {
  const router = useRouter();
  const { accounts, transactions, importTransactions, categoriesFor } = useFinance();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [body, setBody] = useState<string[][]>([]);
  const [map, setMap] = useState<ColumnMapping | null>(null);
  const [overrides, setOverrides] = useState<Record<number, Partial<Row>>>({});
  const [accountId, setAccountId] = useState(NO_ACCOUNT);
  const [pending, setPending] = useState(false);

  const knownIds = useMemo(() => new Set(transactions.map((x) => x.externalId).filter(Boolean)), [transactions]);
  const categoryModel = useMemo(() => buildCategoryModel(transactions), [transactions]);

  const result = useMemo(() => (map ? rowsToTransactions(body, map) : null), [body, map]);
  const rows: Row[] = useMemo(
    () =>
      (result?.parsed ?? []).map((p, key) => {
        const duplicate = knownIds.has(p.externalId);
        // A category column in the file wins; otherwise use what the user usually picks.
        const learned = map && map.category < 0 ? (suggestCategory(categoryModel, p.title, "", p.type) as Row["category"] | null) : null;
        return { ...p, category: learned ?? p.category, key, duplicate, include: !duplicate, ...overrides[key] };
      }),
    [result, knownIds, overrides, categoryModel, map]
  );
  const selected = rows.filter((r) => r.include);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) return void toast.error(t("File is too large"), { description: t("Upload a CSV under 2 MB, or split the statement by month.") });
    const text = await file.text();
    const [head, ...rest] = parseCsv(text);
    if (!head || !rest.length) return void toast.error(t("No rows found in this file."));
    setFileName(file.name);
    setHeaders(head);
    setBody(rest);
    setMap(detectColumns(head));
    setOverrides({});
  }

  function reset() {
    setHeaders([]);
    setBody([]);
    setMap(null);
    setOverrides({});
    if (fileRef.current) fileRef.current.value = "";
  }

  const update = (key: number, patch: Partial<Row>) => setOverrides((o) => ({ ...o, [key]: { ...o[key], ...patch } }));

  async function submit() {
    setPending(true);
    let created = 0;
    let skipped = 0;
    for (let i = 0; i < selected.length; i += BATCH) {
      const res = await importTransactions(
        selected.slice(i, i + BATCH).map((r) => ({
          title: r.title,
          merchant: "",
          category: r.category,
          date: r.date,
          amount: r.amount,
          type: r.type,
          paymentMethod: "bank_transfer",
          notes: t("Imported from {file}", { file: fileName }).slice(0, 500),
          accountId: accountId === NO_ACCOUNT ? null : accountId,
          externalId: r.externalId,
        }))
      );
      if (!res) break;
      created += res.created;
      skipped += res.skipped;
    }
    setPending(false);
    if (created || skipped) router.push("/transactions");
  }

  if (!map)
    return (
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            {t("Upload a bank statement")}
          </CardTitle>
          <CardDescription>
            {t("Download your statement as CSV from internet banking (or export from Excel) and upload it here. You'll review everything before it's saved.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:border-primary hover:bg-primary/5">
            <Upload className="size-8 text-muted-foreground" />
            <span className="text-sm font-medium">{t("Choose a CSV file")}</span>
            <span className="text-xs text-muted-foreground">{t("Up to 2 MB · .csv")}</span>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </CardContent>
      </Card>
    );

  const column = (label: string, field: keyof ColumnMapping, optional = false) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={String(map[field])} onValueChange={(v) => setMap({ ...map, [field]: Number(v) })}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          {optional && <SelectItem value={NONE}>{t("Not in file")}</SelectItem>}
          {headers.map((h, i) => (
            <SelectItem key={i} value={String(i)}>{h || t("Column {n}", { n: i + 1 })}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const splitColumns = map.amount < 0;

  return (
    <div className="space-y-4">
      <Card className="animate-in-up">
        <CardHeader>
          <CardTitle className="text-base">{fileName}</CardTitle>
          <CardDescription>{t("Check that each field points at the right column.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {column(t("Date"), "date")}
            {column(t("Description"), "description", true)}
            <div className="space-y-1.5">
              <Label>{t("Amounts")}</Label>
              <Select
                value={splitColumns ? "split" : "single"}
                onValueChange={(v) => {
                  const d = detectColumns(headers);
                  setMap(v === "split" ? { ...map, amount: -1, debit: d.debit, credit: d.credit } : { ...map, amount: d.amount >= 0 ? d.amount : 0 });
                }}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">{t("One column (+/−)")}</SelectItem>
                  <SelectItem value="split">{t("Separate debit and credit")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {splitColumns ? (
              <div className="grid grid-cols-2 gap-2">
                {column(t("Debit"), "debit", true)}
                {column(t("Credit"), "credit", true)}
              </div>
            ) : (
              column(t("Amount"), "amount")
            )}
          </div>
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5">
              <Label>{t("Account")}</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ACCOUNT}>{t("No account")}</SelectItem>
                  {accounts.filter((a) => !a.archived).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
          <p className="text-xs text-muted-foreground">
            {t("{n} rows ready", { n: rows.length })}
            {result && result.skipped.length > 0 && ` · ${t("{n} rows skipped (no date or amount, or a transfer)", { n: result.skipped.length })}`}
            {rows.some((r) => r.duplicate) && ` · ${t("{n} already imported", { n: rows.filter((r) => r.duplicate).length })}`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y pt-2">
          {rows.slice(0, PREVIEW_LIMIT).map((r) => (
            <div key={r.key} className={`flex flex-wrap items-center gap-3 py-2.5 ${r.include ? "" : "opacity-50"}`}>
              <Switch checked={r.include} onCheckedChange={(v) => update(r.key, { include: v })} aria-label={t("Include")} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(r.date, "d MMM yyyy")}</p>
              </div>
              {r.duplicate && <Badge variant="secondary">{t("Already imported")}</Badge>}
              <Select value={r.category} onValueChange={(v) => update(r.key, { category: v as ExpenseCategory | IncomeCategory })}>
                <SelectTrigger className="h-8 w-36" aria-label={t("Category")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoriesFor(r.type).map((c) => (
                    <SelectItem key={c} value={c}>{t(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className={`w-28 text-right text-sm font-semibold tabular-nums ${r.type === "income" ? "text-success" : ""}`}>
                {r.type === "income" ? "+" : "−"}
                {formatCurrency(r.amount)}
              </p>
            </div>
          ))}
          {rows.length > PREVIEW_LIMIT && (
            <p className="py-3 text-center text-xs text-muted-foreground">
              {t("Showing the first {n} rows. All selected rows will be imported.", { n: PREVIEW_LIMIT })}
            </p>
          )}
          {!rows.length && <p className="py-8 text-center text-sm text-muted-foreground">{t("No rows could be read with these columns.")}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
