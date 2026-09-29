import { describe, expect, it } from "vitest";
import { payoffOrder, simulateDebtPayoff, type Debt } from "@/lib/calculations";

const debts: Debt[] = [
  { id: "card", name: "Card", balance: 50000, rate: 30, minPayment: 2500 },
  { id: "loan", name: "Loan", balance: 20000, rate: 9, minPayment: 1000 },
];

describe("debt payoff", () => {
  it("orders by rate or by balance", () => {
    expect(payoffOrder(debts, "avalanche").map((d) => d.id)).toEqual(["card", "loan"]);
    expect(payoffOrder(debts, "snowball").map((d) => d.id)).toEqual(["loan", "card"]);
  });

  it("pays everything off and avalanche costs no more interest than snowball", () => {
    const a = simulateDebtPayoff(debts, 5000, "avalanche");
    const s = simulateDebtPayoff(debts, 5000, "snowball");
    expect(a.neverPaysOff).toBe(false);
    expect(Object.keys(a.payoffMonth).sort()).toEqual(["card", "loan"]);
    expect(a.totalInterest).toBeLessThanOrEqual(s.totalInterest);
    expect(s.payoffMonth.loan).toBeLessThan(s.payoffMonth.card);
    expect(a.balances.at(-1)).toBe(0);
  });

  it("extra payments shorten the plan", () => {
    expect(simulateDebtPayoff(debts, 10000, "avalanche").months).toBeLessThan(simulateDebtPayoff(debts, 0, "avalanche").months);
  });

  it("detects payments that never cover interest", () => {
    const r = simulateDebtPayoff([{ id: "x", name: "X", balance: 100000, rate: 36, minPayment: 1000 }], 0, "avalanche");
    expect(r.neverPaysOff).toBe(true);
  });

  it("zero-interest debt takes balance / payment months", () => {
    expect(simulateDebtPayoff([{ id: "x", name: "X", balance: 1000, rate: 0, minPayment: 100 }], 0, "snowball").months).toBe(10);
  });
});
