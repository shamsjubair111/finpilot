import { describe, expect, it } from "vitest";
import { amountInAccountCurrency, isForeign, toBase } from "@/lib/fx";

const rates = { USD: 120 };

describe("fx", () => {
  it("knows which accounts are foreign", () => {
    expect(isForeign("USD", "BDT")).toBe(true);
    expect(isForeign("BDT", "BDT")).toBe(false);
    expect(isForeign(null, "BDT")).toBe(false);
  });

  it("converts to the main currency when a rate exists", () => {
    expect(toBase(10, "USD", "BDT", rates)).toBe(1200);
    expect(toBase(10, "BDT", "BDT", rates)).toBe(10);
    expect(toBase(10, "EUR", "BDT", rates)).toBeNull();
  });

  it("uses the recorded foreign amount for foreign accounts", () => {
    expect(amountInAccountCurrency({ amount: 12100, originalAmount: 100, originalCurrency: "USD" }, "USD", "BDT", rates)).toBe(100);
    expect(amountInAccountCurrency({ amount: 1200 }, "USD", "BDT", rates)).toBe(10);
    expect(amountInAccountCurrency({ amount: 500, originalAmount: 5, originalCurrency: "USD" }, null, "BDT", rates)).toBe(500);
  });
});

import { baseBalances, computeBalances, netWorthOf } from "@/lib/accounts";
import type { Account, Transaction } from "@/types/finance";

describe("foreign-currency accounts", () => {
  const accounts = [
    { id: "bank", name: "Bank", type: "bank", openingBalance: 10000, color: "" },
    { id: "payoneer", name: "Payoneer", type: "e_wallet", openingBalance: 50, currency: "USD", color: "" },
  ] as Account[];
  const txns = [
    // Client paid $200 (recorded at 120 → ৳24,000).
    { id: "1", title: "Client", merchant: "", category: "Freelance", date: "2026-09-01", amount: 24000, type: "income", paymentMethod: "other", accountId: "payoneer", originalAmount: 200, originalCurrency: "USD" },
    // Withdrew $100 to the bank, which received ৳12,100.
    { id: "2", title: "Withdraw", merchant: "", category: "Transfer", date: "2026-09-05", amount: 12100, type: "transfer", paymentMethod: "bank_transfer", accountId: "payoneer", toAccountId: "bank", originalAmount: 100, originalCurrency: "USD" },
  ] as Transaction[];
  const fx = { base: "BDT", rates: { USD: 121 } };

  it("keeps each account's balance in its own currency", () => {
    const b = computeBalances(accounts, txns, fx);
    expect(b.get("payoneer")).toBe(150);
    expect(b.get("bank")).toBe(22100);
  });

  it("converts foreign balances for net worth and reports missing rates", () => {
    const b = computeBalances(accounts, txns, fx);
    expect(netWorthOf(accounts, b, fx).netWorth).toBe(22100 + 150 * 121);
    expect(baseBalances(accounts, b, { base: "BDT", rates: {} }).missingRates).toEqual(["USD"]);
  });

  it("behaves exactly as before without a currency context", () => {
    expect(computeBalances(accounts.slice(0, 1), [], undefined).get("bank")).toBe(10000);
  });
});
