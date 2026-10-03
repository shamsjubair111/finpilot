import type { Account, Transaction } from "@/types/finance";
import { computeBalances, isLiability, netWorthOf } from "@/lib/accounts";
import { valueInvestment, type InvestmentInput } from "@/lib/calculations/investments";
import type { Rates } from "@/lib/fx";

export interface AssistantData {
  name: string;
  currency: string;
  monthlySalary: number;
  currentSavings: number;
  emergencyFundTarget: number;
  emergencyFundCurrent: number;
  defaultSavingsTarget: number;
  accounts: Account[];
  transactions: Transaction[];
  budgets: { category: string; budgeted: number }[];
  goals: { name: string; goalAmount: number; currentAmount: number; monthlyContribution: number; targetDate: string }[];
  purchases: { name: string; price: number; savedAmount: number; desiredDate: string }[];
  commitments: { title: string; amount: number; dueDate: string; recurring: boolean; frequency: string; type: string }[];
  investments: (InvestmentInput & { name: string })[];
  exchangeRates?: unknown;
}

const r = (n: number) => Math.round(n).toLocaleString("en-US");
const d = (iso: string | Date) => new Date(iso).toISOString().slice(0, 10);

/**
 * A compact plain-text snapshot of the user's finances for the assistant. Amounts are rounded,
 * lists are capped, and account numbers are never included.
 */
export function buildFinancialSummary(data: AssistantData, now = new Date()) {
  const cur = data.currency;
  const lines: string[] = [];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  lines.push(`Today: ${d(now)}. Currency: ${cur}. Name: ${data.name}.`);
  lines.push(
    `Profile: monthly take-home income ${r(data.monthlySalary)}, savings ${r(data.currentSavings)}, emergency fund ${r(data.emergencyFundCurrent)} of ${r(data.emergencyFundTarget)} target, savings target ${data.defaultSavingsTarget}% of income.`
  );

  const fx = { base: cur, rates: (data.exchangeRates ?? {}) as Rates };
  const balances = computeBalances(data.accounts, data.transactions, fx);
  const nw = netWorthOf(data.accounts, balances, fx);
  lines.push(`Net worth ${r(nw.netWorth)} (assets ${r(nw.assets)}, debts ${r(nw.liabilities)}).`);
  const active = data.accounts.filter((a) => !a.archived);
  if (active.length) {
    lines.push("Accounts:");
    for (const a of active.slice(0, 20))
      lines.push(`- ${a.name} (${a.type}${isLiability(a.type) ? ", owed" : ""}${a.interestRate ? `, ${a.interestRate}%/yr` : ""}): ${r(balances.get(a.id) ?? 0)}${a.currency && a.currency !== cur ? ` ${a.currency}` : ""}`);
  }

  const month = (from: Date, to: Date) => {
    let income = 0, expenses = 0;
    const cats = new Map<string, number>();
    for (const t of data.transactions) {
      const td = new Date(t.date);
      if (td < from || td >= to) continue;
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") {
        expenses += t.amount;
        cats.set(t.category, (cats.get(t.category) ?? 0) + t.amount);
      }
    }
    return { income, expenses, cats };
  };
  const thisMonth = month(monthStart, new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const lastMonth = month(lastStart, monthStart);
  lines.push(`This month so far (day ${now.getDate()}): income ${r(thisMonth.income)}, spending ${r(thisMonth.expenses)}.`);
  lines.push(`Last month: income ${r(lastMonth.income)}, spending ${r(lastMonth.expenses)}.`);
  const catLine = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c, a]) => `${c} ${r(a)}`).join(", ");
  if (thisMonth.cats.size) lines.push(`Spending by category this month: ${catLine(thisMonth.cats)}.`);
  if (lastMonth.cats.size) lines.push(`Spending by category last month: ${catLine(lastMonth.cats)}.`);

  if (data.budgets.length)
    lines.push(`Monthly budgets (spent this month / budget): ${data.budgets.map((b) => `${b.category} ${r(thisMonth.cats.get(b.category) ?? 0)}/${r(b.budgeted)}`).join(", ")}.`);
  if (data.goals.length)
    lines.push(`Goals: ${data.goals.slice(0, 10).map((g) => `${g.name} ${r(g.currentAmount)}/${r(g.goalAmount)} by ${d(g.targetDate)} (+${r(g.monthlyContribution)}/month)`).join("; ")}.`);
  if (data.purchases.length)
    lines.push(`Wishlist: ${data.purchases.slice(0, 10).map((p) => `${p.name} ${r(p.price)} (saved ${r(p.savedAmount)}, wanted by ${d(p.desiredDate)})`).join("; ")}.`);
  const upcoming = data.commitments.filter((c) => new Date(c.dueDate).getTime() - now.getTime() < 45 * 86400000);
  if (upcoming.length)
    lines.push(`Bills and regular income in the next 45 days: ${upcoming.slice(0, 15).map((c) => `${c.title} ${c.type === "income" ? "+" : "-"}${r(c.amount)} on ${d(c.dueDate)}${c.recurring ? ` (${c.frequency})` : ""}`).join("; ")}.`);
  if (data.investments.length)
    lines.push(`Investments: ${data.investments.slice(0, 10).map((i) => {
      const v = valueInvestment(i, now);
      return `${i.name} (${i.kind}) value ${r(v.value)}, profit ${r(v.profit)}${i.maturityDate ? `, matures ${d(i.maturityDate)}` : ""}`;
    }).join("; ")}.`);

  const recent = [...data.transactions].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 15);
  if (recent.length) {
    lines.push("Most recent transactions:");
    for (const t of recent) lines.push(`- ${d(t.date)} ${t.type} ${r(t.amount)} ${t.category}: ${t.title.slice(0, 60)}`);
  }
  return lines.join("\n");
}
