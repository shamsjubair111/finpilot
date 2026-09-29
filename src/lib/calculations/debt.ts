export interface Debt {
  id: string;
  name: string;
  balance: number;
  /** Annual interest rate in percent. */
  rate: number;
  minPayment: number;
}

export type DebtStrategy = "avalanche" | "snowball";

export interface DebtPlan {
  months: number;
  totalInterest: number;
  totalPaid: number;
  /** Month number (1-based) each debt is cleared, by id. */
  payoffMonth: Record<string, number>;
  /** Remaining total balance at the end of each month, for charting. */
  balances: number[];
  /** True when payments never cover interest, so the plan stops at the cap. */
  neverPaysOff: boolean;
}

const MAX_MONTHS = 600;

/** Order in which extra money is thrown at debts: highest rate first (avalanche) or smallest balance first (snowball). */
export function payoffOrder(debts: Debt[], strategy: DebtStrategy) {
  return [...debts].sort((a, b) =>
    strategy === "avalanche" ? b.rate - a.rate || a.balance - b.balance : a.balance - b.balance || b.rate - a.rate
  );
}

/**
 * Month-by-month simulation: interest accrues, every debt gets its minimum, and the extra budget
 * (plus minimums freed up by cleared debts, i.e. the "rollover") goes to the first debt in priority order.
 */
export function simulateDebtPayoff(debts: Debt[], extraPerMonth: number, strategy: DebtStrategy): DebtPlan {
  const order = payoffOrder(debts.filter((d) => d.balance > 0), strategy);
  const bal = new Map(order.map((d) => [d.id, d.balance]));
  const budget = order.reduce((s, d) => s + Math.max(0, d.minPayment), 0) + Math.max(0, extraPerMonth);
  const payoffMonth: Record<string, number> = {};
  const balances: number[] = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let month = 0;

  while ([...bal.values()].some((b) => b > 0.005) && month < MAX_MONTHS) {
    month++;
    for (const d of order) {
      const b = bal.get(d.id)!;
      if (b <= 0) continue;
      const interest = (b * d.rate) / 100 / 12;
      totalInterest += interest;
      bal.set(d.id, b + interest);
    }
    let available = budget;
    // Minimums first, so no debt goes unpaid while another gets extra.
    for (const d of order) {
      const b = bal.get(d.id)!;
      if (b <= 0) continue;
      const pay = Math.min(b, Math.max(0, d.minPayment), available);
      bal.set(d.id, b - pay);
      available -= pay;
    }
    for (const d of order) {
      if (available <= 0) break;
      const b = bal.get(d.id)!;
      if (b <= 0) continue;
      const pay = Math.min(b, available);
      bal.set(d.id, b - pay);
      available -= pay;
    }
    totalPaid += budget - available;
    for (const d of order) {
      if ((bal.get(d.id) ?? 0) <= 0.005 && !payoffMonth[d.id]) {
        bal.set(d.id, 0);
        payoffMonth[d.id] = month;
      }
    }
    balances.push([...bal.values()].reduce((s, b) => s + Math.max(0, b), 0));
  }

  return {
    months: month,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    payoffMonth,
    balances,
    neverPaysOff: month >= MAX_MONTHS && [...bal.values()].some((b) => b > 0.005),
  };
}
