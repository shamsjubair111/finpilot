import { describe, expect, it } from "vitest";
import { detectRecurring } from "@/lib/recurring-detect";
import type { Transaction } from "@/types/finance";

const now = new Date(2026, 8, 20);
const tx = (y: number, m: number, d: number, title: string, amount: number, extra: Partial<Transaction> = {}): Transaction =>
  ({ id: `${title}${m}${d}${amount}`, title, merchant: "", category: "Bills", date: new Date(y, m, d, 10).toISOString(), amount, type: "expense", paymentMethod: "card", ...extra }) as Transaction;

describe("detectRecurring", () => {
  const netflix = [5, 6, 7, 8].map((m) => tx(2026, m, 12, "Netflix", 650));
  const groceries = [tx(2026, 7, 3, "Shwapno", 900), tx(2026, 7, 9, "Shwapno", 4000), tx(2026, 8, 1, "Shwapno", 300), tx(2026, 6, 15, "Shwapno", 2500)];

  it("suggests a steady monthly payment", () => {
    const [s] = detectRecurring(netflix, [], now);
    expect(s).toMatchObject({ title: "Netflix", amount: 650, day: 12, occurrences: 4 });
    expect(s.nextDue.getMonth()).toBe(9);
  });

  it("ignores irregular amounts, already-tracked bills and stopped payments", () => {
    expect(detectRecurring(groceries, [], now)).toHaveLength(0);
    expect(detectRecurring(netflix, ["Netflix subscription"], now)).toHaveLength(0);
    expect(detectRecurring([3, 4, 5].map((m) => tx(2026, m, 12, "Gym", 2000)), [], now)).toHaveLength(0);
  });

  it("needs at least three months", () => {
    expect(detectRecurring(netflix.slice(2), [], now)).toHaveLength(0);
  });
});
