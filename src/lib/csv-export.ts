/** Transactions as CSV, shared by the server export and the in-page "Export these" button. */
export const CSV_COLUMNS = ["date", "type", "title", "merchant", "category", "amount", "paymentMethod", "account", "toAccount", "notes"] as const;

export function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  // Quote everything and neutralise leading formula characters so spreadsheets don't execute them.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

interface CsvTransaction {
  date: string | Date;
  type: string;
  title: string;
  merchant: string;
  category: string;
  amount: number;
  paymentMethod: string;
  accountId?: string | null;
  toAccountId?: string | null;
  notes?: string | null;
}

/** CSV text with a BOM so Excel opens Bangla text correctly. */
export function transactionsCsv(transactions: CsvTransaction[], accountNames: Map<string, string>) {
  const lines = [
    CSV_COLUMNS.join(","),
    ...transactions.map((t) =>
      [
        new Date(t.date).toISOString(),
        t.type,
        t.title,
        t.merchant,
        t.category,
        t.amount,
        t.paymentMethod,
        accountNames.get(t.accountId ?? ""),
        accountNames.get(t.toAccountId ?? ""),
        t.notes,
      ]
        .map(csvCell)
        .join(",")
    ),
  ];
  return "﻿" + lines.join("\r\n");
}
