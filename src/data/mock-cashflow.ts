import type { MonthlyFinancials } from "@/types/finance";

// Central 12-month mock cash flow history (Oct 2025 - Sep 2026), used by
// the Dashboard (last 6 months) and Reports (3/6/12-month & this-year
// ranges). Replace with GET /api/cashflow?months=n when the backend exists.
export const mockCashFlow12Months: MonthlyFinancials[] = [
  { month: "Oct", income: 66000, expenses: 42100, savings: 23900 },
  { month: "Nov", income: 66000, expenses: 44800, savings: 21200 },
  { month: "Dec", income: 91000, expenses: 52300, savings: 38700 },
  { month: "Jan", income: 66000, expenses: 39500, savings: 26500 },
  { month: "Feb", income: 66000, expenses: 40200, savings: 25800 },
  { month: "Mar", income: 66000, expenses: 37900, savings: 28100 },
  { month: "Apr", income: 66000, expenses: 41200, savings: 24800 },
  { month: "May", income: 66000, expenses: 38900, savings: 27100 },
  { month: "Jun", income: 66000, expenses: 43500, savings: 22500 },
  { month: "Jul", income: 74500, expenses: 40100, savings: 34400 },
  { month: "Aug", income: 66000, expenses: 37800, savings: 28200 },
  { month: "Sep", income: 66000, expenses: 35000, savings: 31000 },
];

export const mockMonthlyCashFlow: MonthlyFinancials[] = mockCashFlow12Months.slice(-6);

// Category spend history (Aug vs Sep) used for trend insights.
export const mockCategoryTrend = {
  Food: { previous: 5400, current: 6200 },
  Transport: { previous: 4100, current: 3800 },
  Shopping: { previous: 3100, current: 4200 },
  Entertainment: { previous: 2600, current: 2900 },
};
