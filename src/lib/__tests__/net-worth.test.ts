import { describe, expect, it } from "vitest";
import { netWorthHistory } from "@/lib/accounts";
import type { Account, Transaction } from "@/types/finance";

const accounts = [
  { id: "bank", name: "Bank", type: "bank", openingBalance: 1000, color: "" },
  { id: "card", name: "Card", type: "credit_card", openingBalance: 0, color: "" },
] as Account[];

const txn = (date: string, amount: number, type: Transaction["type"], accountId: string): Transaction =>
  ({ id: date + accountId, title: "", merchant: "", category: "Other", date, amount, type, paymentMethod: "other", accountId }) as Transaction;

describe("netWorthHistory", () => {
  it("replays transactions month by month and ends at today's net worth", () => {
    const now = new Date(2026, 8, 29);
    const txns = [
      txn(new Date(2026, 6, 10).toISOString(), 500, "income", "bank"),
      txn(new Date(2026, 7, 5).toISOString(), 300, "expense", "card"),
      txn(new Date(2026, 8, 1).toISOString(), 200, "expense", "bank"),
    ];
    const h = netWorthHistory(accounts, txns, 3, now);
    expect(h.map((p) => p.netWorth)).toEqual([1500, 1200, 1000]);
    expect(h[1].liabilities).toBe(300);
    expect(h[2].monthEnd).toBe(now);
  });
});
