import { describe, expect, it } from "vitest";
import { buildFinancialSummary, type AssistantData } from "@/lib/assistant-context";
import type { Account, Transaction } from "@/types/finance";

const now = new Date(2026, 8, 20);
const data: AssistantData = {
  name: "Rahim", currency: "BDT", monthlySalary: 60000, currentSavings: 100000, emergencyFundTarget: 300000, emergencyFundCurrent: 50000, defaultSavingsTarget: 20,
  accounts: [{ id: "a", name: "DBBL", type: "bank", openingBalance: 10000, color: "", accountNumber: "1234567890" }] as Account[],
  transactions: [
    { id: "1", title: "Salary", merchant: "", category: "Salary", date: new Date(2026, 8, 1).toISOString(), amount: 60000, type: "income", paymentMethod: "bank_transfer", accountId: "a" },
    { id: "2", title: "Rent", merchant: "", category: "Housing", date: new Date(2026, 8, 3).toISOString(), amount: 20000, type: "expense", paymentMethod: "bank_transfer", accountId: "a" },
  ] as Transaction[],
  budgets: [{ category: "Housing", budgeted: 22000 }],
  goals: [], purchases: [], commitments: [], investments: [],
};

describe("buildFinancialSummary", () => {
  it("includes balances, month totals and budgets without account numbers", () => {
    const s = buildFinancialSummary(data, now);
    expect(s).toContain("Net worth 50,000");
    expect(s).toContain("This month so far (day 20): income 60,000, spending 20,000.");
    expect(s).toContain("Housing 20,000/22,000");
    expect(s).not.toContain("1234567890");
  });
});
