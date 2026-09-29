export const INVESTMENT_KINDS = ["sanchayapatra", "fdr", "dps", "stock", "mutual_fund", "gold", "bond", "other"] as const;
export type InvestmentKind = (typeof INVESTMENT_KINDS)[number];
export const PAYOUTS = ["maturity", "monthly", "quarterly"] as const;
export type Payout = (typeof PAYOUTS)[number];

export interface InvestmentInput {
  kind: InvestmentKind;
  /** Amount invested up front (for DPS: nothing; deposits are monthly). */
  principal: number;
  /** Annual profit/interest rate in percent (fixed-income kinds). */
  rate: number;
  startDate: string;
  maturityDate?: string | null;
  payout: Payout;
  /** DPS instalment per month. */
  monthlyDeposit?: number | null;
  /** Latest market value for shares, funds, gold and other. */
  currentValue?: number | null;
}

export interface InvestmentValuation {
  /** Money the user has put in so far. */
  invested: number;
  /** What the holding is worth today (excluding profit already paid out). */
  value: number;
  /** Profit earned to date: paid out (periodic payouts) or accrued (at maturity / DPS) or market gain. */
  profit: number;
  maturityValue: number | null;
  daysToMaturity: number | null;
  matured: boolean;
  method: "fixed" | "dps" | "market";
}

const DAY = 24 * 60 * 60 * 1000;
const MARKET: InvestmentKind[] = ["stock", "mutual_fund", "gold", "other"];

const monthsBetween = (a: Date, b: Date) =>
  Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) - (b.getDate() < a.getDate() ? 1 : 0));

/** Future value of `months` monthly deposits of `m` at annual `rate`% compounded monthly, each deposited at the start of the month. */
export function dpsValue(m: number, rate: number, months: number) {
  const r = rate / 100 / 12;
  if (months <= 0) return 0;
  if (r === 0) return m * months;
  return m * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

/**
 * Estimated, pre-tax valuation. Fixed-income profit is simple interest (how Sanchayapatra and most
 * FDRs in Bangladesh quote returns); periodic payouts leave the value at the principal.
 */
export function valueInvestment(inv: InvestmentInput, now = new Date()): InvestmentValuation {
  const start = new Date(inv.startDate);
  const maturity = inv.maturityDate ? new Date(inv.maturityDate) : null;
  const end = maturity && maturity < now ? maturity : now;
  const matured = !!maturity && maturity <= now;
  const daysToMaturity = maturity ? Math.max(0, Math.ceil((maturity.getTime() - now.getTime()) / DAY)) : null;
  const principal = Math.max(0, inv.principal);

  if (MARKET.includes(inv.kind) || inv.kind === "other") {
    const value = Math.max(0, inv.currentValue ?? principal);
    return { invested: principal, value, profit: value - principal, maturityValue: null, daysToMaturity, matured, method: "market" };
  }

  if (inv.kind === "dps") {
    const m = Math.max(0, inv.monthlyDeposit ?? 0);
    const paidMonths = monthsBetween(start, end) + (end >= start ? 1 : 0);
    const totalMonths = maturity ? monthsBetween(start, maturity) : null;
    const months = totalMonths !== null ? Math.min(paidMonths, totalMonths) : paidMonths;
    const invested = m * months;
    const value = dpsValue(m, inv.rate, months);
    return {
      invested,
      value,
      profit: value - invested,
      maturityValue: totalMonths !== null ? dpsValue(m, inv.rate, totalMonths) : null,
      daysToMaturity,
      matured,
      method: "dps",
    };
  }

  const years = Math.max(0, (end.getTime() - start.getTime()) / (365 * DAY));
  const termYears = maturity ? Math.max(0, (maturity.getTime() - start.getTime()) / (365 * DAY)) : null;
  const rate = Math.max(0, inv.rate) / 100;
  if (inv.payout === "maturity") {
    const value = principal * (1 + rate * years);
    return {
      invested: principal,
      value,
      profit: value - principal,
      maturityValue: termYears !== null ? principal * (1 + rate * termYears) : null,
      daysToMaturity,
      matured,
      method: "fixed",
    };
  }
  // Monthly/quarterly payouts: only completed periods have been paid.
  const periodMonths = inv.payout === "monthly" ? 1 : 3;
  const periods = Math.floor(monthsBetween(start, end) / periodMonths);
  const paid = principal * rate * (periods * periodMonths) / 12;
  return {
    invested: principal,
    value: principal,
    profit: paid,
    maturityValue: termYears !== null ? principal : null,
    daysToMaturity,
    matured,
    method: "fixed",
  };
}
