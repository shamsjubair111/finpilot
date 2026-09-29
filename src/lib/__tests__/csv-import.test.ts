import { describe, expect, it } from "vitest";
import { detectColumns, parseAmount, parseCsv, parseStatementDate, rowsToTransactions } from "@/lib/csv-import";

describe("parseCsv", () => {
  it("handles quotes, embedded commas, CRLF and BOM", () => {
    expect(parseCsv('﻿a,b\r\n"x, y","he said ""hi"""\r\n')).toEqual([["a", "b"], ["x, y", 'he said "hi"']]);
  });
  it("detects semicolon delimiters and skips blank lines", () => {
    expect(parseCsv("a;b\n\n1;2\n")).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("parsers", () => {
  it("parses statement dates", () => {
    expect(parseStatementDate("2026-09-28")?.toISOString().slice(0, 10)).toBe("2026-09-28");
    expect(parseStatementDate("28/09/2026")?.toISOString().slice(0, 10)).toBe("2026-09-28");
    expect(parseStatementDate("28-Sep-26")?.toISOString().slice(0, 10)).toBe("2026-09-28");
    expect(parseStatementDate("13/13/2026")).toBeNull();
    expect(parseStatementDate("hello")).toBeNull();
  });
  it("parses amounts", () => {
    expect(parseAmount("1,234.50")).toBe(1234.5);
    expect(parseAmount("(500)")).toBe(-500);
    expect(parseAmount("-500")).toBe(-500);
    expect(parseAmount("500 Dr")).toBe(-500);
    expect(parseAmount("৳ 500")).toBe(500);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });
});

describe("rowsToTransactions", () => {
  it("handles debit/credit statements", () => {
    const [header, ...rows] = parseCsv("Date,Narration,Debit,Credit,Balance\n01/09/2026,SALARY SEPT,,55000,60000\n02/09/2026,DESCO BILL,2100,,57900\n02/09/2026,junk,,,\n");
    const map = detectColumns(header);
    expect(map).toMatchObject({ date: 0, description: 1, amount: -1, debit: 2, credit: 3 });
    const { parsed, skipped } = rowsToTransactions(rows, map);
    expect(parsed.map((p) => [p.type, p.amount, p.category])).toEqual([["income", 55000, "Salary"], ["expense", 2100, "Bills"]]);
    expect(skipped).toEqual([2]);
  });

  it("round-trips Sanchay's own export and keeps repeats distinct", () => {
    const csv = 'date,type,title,merchant,category,amount\n"2026-09-01T00:00:00.000Z","expense","Tea","","Food","20"\n"2026-09-01T00:00:00.000Z","expense","Tea","","Food","20"\n"2026-09-02T00:00:00.000Z","transfer","Move","","Transfer","100"\n';
    const [header, ...rows] = parseCsv(csv);
    const { parsed, skipped } = rowsToTransactions(rows, detectColumns(header));
    expect(parsed).toHaveLength(2);
    expect(parsed[0].category).toBe("Food");
    expect(parsed[0].externalId).not.toBe(parsed[1].externalId);
    expect(skipped).toEqual([2]);
    // Same file again gives the same IDs, so a re-upload is detected as duplicates.
    expect(rowsToTransactions(rows, detectColumns(header)).parsed.map((p) => p.externalId)).toEqual(parsed.map((p) => p.externalId));
  });
});
