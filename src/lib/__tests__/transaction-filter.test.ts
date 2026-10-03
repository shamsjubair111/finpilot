import { describe, expect, it } from "vitest";
import { matchesSearch, periodRange } from "@/lib/transaction-filter";

describe("periodRange", () => {
  const now = new Date(2026, 0, 15);
  it("handles month and year boundaries", () => {
    expect(periodRange("last_month", now)).toEqual([new Date(2025, 11, 1), new Date(2026, 0, 1)]);
    expect(periodRange("last_3_months", now)).toEqual([new Date(2025, 10, 1), new Date(2026, 1, 1)]);
    expect(periodRange("last_year", now)).toEqual([new Date(2025, 0, 1), new Date(2026, 0, 1)]);
    expect(periodRange("all", now)).toBeNull();
  });
});

describe("matchesSearch", () => {
  const t = { title: "Lunch", merchant: "Star Kabab", notes: "with Rahim", amount: 1200 };
  it("matches text fields case-insensitively", () => {
    expect(matchesSearch(t, "star")).toBe(true);
    expect(matchesSearch(t, "rahim")).toBe(true);
    expect(matchesSearch(t, "dinner")).toBe(false);
  });
  it("matches amounts typed with or without separators", () => {
    expect(matchesSearch(t, "1200")).toBe(true);
    expect(matchesSearch(t, "1,200")).toBe(true);
    expect(matchesSearch(t, "৳1200")).toBe(true);
    expect(matchesSearch(t, "120")).toBe(false);
  });
});
