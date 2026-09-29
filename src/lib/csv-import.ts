import type { ExpenseCategory, IncomeCategory } from "@/types/finance";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";

/** RFC 4180-style CSV parsing: quoted fields, escaped quotes, commas/newlines inside quotes, CRLF, BOM. */
export function parseCsv(text: string, delimiter?: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const sep = delimiter ?? guessDelimiter(src);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"' && field === "") quoted = true;
    else if (ch === sep) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ""));
}

function guessDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const counts = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length] as const);
  return counts.sort((a, b) => b[1] - a[1])[0][0];
}

export interface ColumnMapping {
  date: number;
  description: number;
  /** Single signed amount column, or -1 when the file uses separate debit/credit columns. */
  amount: number;
  debit: number;
  credit: number;
  /** Optional income/expense column (e.g. Sanchay's own export). */
  type: number;
  category: number;
}

const find = (headers: string[], patterns: RegExp[]) => {
  for (const p of patterns) {
    const i = headers.findIndex((h) => p.test(h));
    if (i >= 0) return i;
  }
  return -1;
};

/** Guesses which column holds what from common bank-statement headers. */
export function detectColumns(headers: string[]): ColumnMapping {
  const h = headers.map((x) => x.toLowerCase().trim());
  return {
    date: find(h, [/^(txn |transaction |value |posting )?date$/, /date/]),
    description: find(h, [/^(title|description|narration|particulars|details|remarks)$/, /descr|narrat|particular|detail|remark|merchant|payee/]),
    amount: find(h, [/^amount$/, /^amount \(/, /^(txn|transaction) amount$/]),
    debit: find(h, [/^(debit|withdrawal|withdrawals|dr|paid out|money out)$/, /debit|withdraw/]),
    credit: find(h, [/^(credit|deposit|deposits|cr|paid in|money in)$/, /credit|deposit/]),
    type: find(h, [/^type$/, /^(dr\/cr|cr\/dr)$/]),
    category: find(h, [/^category$/]),
  };
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Parses the date formats banks commonly export. Day-first is assumed for slashed dates (Bangladesh, UK, India). */
export function parseStatementDate(value: string): Date | null {
  const v = value.trim();
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0)));
  m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    if (+m[2] < 1 || +m[2] > 12 || +m[1] < 1 || +m[1] > 31) return null;
    return new Date(Date.UTC(year, +m[2] - 1, +m[1]));
  }
  m = v.match(/^(\d{1,2})[\s-]([A-Za-z]{3})[a-z]*[\s-,]+(\d{2,4})/);
  if (m) {
    const month = MONTHS.indexOf(m[2].toLowerCase());
    if (month < 0) return null;
    return new Date(Date.UTC(m[3].length === 2 ? 2000 + +m[3] : +m[3], month, +m[1]));
  }
  return null;
}

/** "1,234.50", "(500)", "-500", "500 Dr", "৳ 500" → signed number; null if it isn't a number. */
export function parseAmount(value: string): number | null {
  let v = value.trim();
  if (!v) return null;
  let sign = 1;
  if (/^\(.*\)$/.test(v)) {
    sign = -1;
    v = v.slice(1, -1);
  }
  if (/\bdr\.?$/i.test(v)) sign = -1;
  v = v.replace(/\b(dr|cr)\.?$/i, "").replace(/[^\d.,-]/g, "").replace(/,/g, "");
  if (v.startsWith("-")) {
    sign *= -1;
    v = v.slice(1);
  }
  const n = Number(v);
  return v && Number.isFinite(n) ? sign * n : null;
}

export interface CsvTransaction {
  date: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: ExpenseCategory | IncomeCategory;
  externalId: string;
}

// Simple keyword rules so imported rows land in a sensible category; users can change them in the preview.
const KEYWORDS: [RegExp, ExpenseCategory][] = [
  [/rent|house|flat/i, "Housing"],
  [/food|restaurant|cafe|foodpanda|pathao food|grocer|shwapno|meena|agora/i, "Food"],
  [/uber|pathao|fuel|petrol|cng|bus|train|transport|parking/i, "Transport"],
  [/daraz|shop|store|mall|amazon|aarong/i, "Shopping"],
  [/netflix|spotify|youtube|subscription|icloud|google/i, "Subscriptions"],
  [/electric|desco|dpdc|wasa|gas|titas|internet|mobile|recharge|bill/i, "Bills"],
  [/hospital|clinic|pharma|doctor|medic/i, "Health"],
  [/school|college|university|tuition|course/i, "Education"],
  [/cinema|movie|game|concert/i, "Entertainment"],
];

export function guessCategory(title: string, type: "income" | "expense"): ExpenseCategory | IncomeCategory {
  if (type === "income") return /salary|payroll/i.test(title) ? "Salary" : "Other";
  return KEYWORDS.find(([re]) => re.test(title))?.[1] ?? "Other";
}

const normalise = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Turns mapped CSV rows into transactions. Rows without a valid date or amount are returned as skipped.
 * The externalId is derived from the row's content (plus how many identical rows came before it in the file),
 * so uploading the same statement twice doesn't create duplicates while genuine repeats within a file are kept.
 */
export function rowsToTransactions(rows: string[][], map: ColumnMapping) {
  const parsed: CsvTransaction[] = [];
  const skipped: number[] = [];
  const seen = new Map<string, number>();
  const cell = (row: string[], i: number) => (i >= 0 ? row[i] ?? "" : "");

  rows.forEach((row, index) => {
    const date = parseStatementDate(cell(row, map.date));
    let amount: number | null = null;
    if (map.amount >= 0) amount = parseAmount(cell(row, map.amount));
    else {
      const debit = parseAmount(cell(row, map.debit));
      const credit = parseAmount(cell(row, map.credit));
      if (debit) amount = -Math.abs(debit);
      else if (credit) amount = Math.abs(credit);
    }
    if (!date || amount === null || amount === 0) {
      skipped.push(index);
      return;
    }
    const typeCell = cell(row, map.type).toLowerCase();
    const type: "income" | "expense" = /^(income|credit|cr)$/.test(typeCell)
      ? "income"
      : /^(expense|debit|dr)$/.test(typeCell)
        ? "expense"
        : amount > 0
          ? "income"
          : "expense";
    if (typeCell === "transfer") {
      skipped.push(index);
      return;
    }
    const title = cell(row, map.description) || (type === "income" ? "Deposit" : "Payment");
    const categoryCell = cell(row, map.category);
    const allowed: string[] = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const category = (allowed.includes(categoryCell) ? categoryCell : guessCategory(title, type)) as ExpenseCategory | IncomeCategory;

    const iso = date.toISOString().slice(0, 10);
    const abs = Math.round(Math.abs(amount) * 100) / 100;
    const key = `${iso}|${abs}|${normalise(title)}`;
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    parsed.push({
      date: date.toISOString(),
      title: title.slice(0, 120),
      amount: abs,
      type,
      category,
      externalId: `csv:${hash(key)}:${n}`,
    });
  });
  return { parsed, skipped };
}

/** Small stable string hash (FNV-1a, 32-bit) so IDs stay short. */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
