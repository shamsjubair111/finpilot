import { describe, expect, it } from "vitest";
import { csvCell, transactionsCsv } from "@/lib/csv-export";

describe("csv export", () => {
  it("quotes cells and neutralises formulas", () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("=SUM(A1)")).toBe(`"'=SUM(A1)"`);
    expect(csvCell(null)).toBe('""');
  });
  it("writes a BOM, header and account names", () => {
    const csv = transactionsCsv(
      [{ date: "2026-10-01T00:00:00.000Z", type: "expense", title: "চা", merchant: "", category: "Food", amount: 20, paymentMethod: "cash", accountId: "a" }],
      new Map([["a", "Wallet"]])
    );
    expect(csv.startsWith("﻿date,type,title")).toBe(true);
    expect(csv).toContain('"চা"');
    expect(csv).toContain('"Wallet"');
  });
});
