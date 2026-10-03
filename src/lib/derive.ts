import { findUnusualExpenses, projectMonthEnd } from "@/lib/alerts";
import { categoryParts } from "@/lib/splits";
import { addMonths, differenceInCalendarDays, format, startOfMonth, subMonths } from "date-fns";
import type {
  BudgetCategory,
  FinancialGoal,
  Insight,
  MonthlyFinancials,
  PurchaseGoal,
  ScenarioInput,
  TimelineMilestone,
  Transaction,
  UpcomingCommitment,
  UserProfile,
} from "@/types/finance";
import { formatCurrency } from "@/lib/currency";
import { calculateGoalProgress, getGoalStatus } from "@/lib/calculations/goals";
import { getBudgetStatus } from "@/lib/calculations/budget";
import { t } from "@/lib/i18n";
import { formatDate } from "@/lib/format-date";

const ESSENTIALS = ["Housing", "Bills", "Food", "Health"];

export function monthOptions(count = 12, now = new Date()) {
  return Array.from({ length: count }, (_, i) => format(subMonths(now, i), "MMMM yyyy"));
}

export function monthlyCashflow(transactions: Transaction[], months: number, end = new Date()): MonthlyFinancials[] {
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = startOfMonth(subMonths(end, months - 1 - i));
    return { key: format(d, "yyyy-MM"), month: formatDate(d, months > 12 ? "MMM yy" : "MMM"), income: 0, expenses: 0, savings: 0 };
  });
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const t of transactions) {
    const i = index.get(format(new Date(t.date), "yyyy-MM"));
    if (i === undefined) continue;
    if (t.type === "income") buckets[i].income += t.amount;
    else if (t.type === "expense") buckets[i].expenses += t.amount;
  }
  return buckets.map(({ month, income, expenses }) => ({ month, income, expenses, savings: income - expenses }));
}

export function monthTotals(transactions: Transaction[], monthLabel: string) {
  let income = 0;
  let expenses = 0;
  for (const t of transactions) {
    if (format(new Date(t.date), "MMMM yyyy") !== monthLabel) continue;
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expenses += t.amount;
  }
  return { income, expenses };
}

export function defaultScenarioInput(user: UserProfile, budgets: BudgetCategory[]): ScenarioInput {
  const essentials = budgets.filter((b) => ESSENTIALS.includes(b.category)).reduce((s, b) => s + b.budgeted, 0);
  const lifestyle = budgets.filter((b) => !ESSENTIALS.includes(b.category)).reduce((s, b) => s + b.budgeted, 0);
  return {
    monthlySalary: user.monthlySalary,
    essentialExpenses: essentials,
    lifestyleSpending: lifestyle,
    savingsTarget: Math.round((user.monthlySalary * user.defaultSavingsTarget) / 100),
    currentSavings: user.currentSavings,
    emergencyFund: user.emergencyFundCurrent,
    purchaseAmount: 0,
    purchaseMonth: 3,
    salaryIncrease: 0,
    additionalMonthlyExpense: 0,
    bonus: 0,
    periodMonths: 12,
  };
}

export function buildTimeline(
  goals: FinancialGoal[],
  purchases: PurchaseGoal[],
  commitments: UpcomingCommitment[],
  user: UserProfile,
  now = new Date()
): TimelineMilestone[] {
  const items: TimelineMilestone[] = [];
  for (const g of goals) {
    items.push({
      id: `goal-${g.id}`,
      date: g.targetDate,
      title: t("{name} target", { name: g.name }),
      description: t("{pct}% funded — {amount} to go.", { pct: calculateGoalProgress(g.currentAmount, g.goalAmount), amount: formatCurrency(Math.max(0, g.goalAmount - g.currentAmount)) }),
      type: g.category === "emergency" ? "emergency_fund" : "goal",
      icon: g.icon,
      amount: g.goalAmount,
    });
  }
  for (const p of purchases) {
    items.push({
      id: `purchase-${p.id}`,
      date: p.desiredDate,
      title: t("Buy {name}", { name: p.name }),
      description: p.notes || t("{saved} saved of {price}.", { saved: formatCurrency(p.savedAmount), price: formatCurrency(p.price) }),
      type: "purchase",
      icon: "ShoppingBag",
      amount: p.price,
    });
  }
  for (const c of commitments) {
    items.push({
      id: `commit-${c.id}`,
      date: c.dueDate,
      title: c.title,
      description: `${t(c.category)}${c.recurring ? ` · ${t("recurring")}` : ""}`,
      type: "contribution",
      icon: c.icon,
      amount: c.amount,
    });
  }
  if (user.emergencyFundTarget > user.emergencyFundCurrent && user.monthlySalary > 0) {
    const monthly = Math.max(1, (user.monthlySalary * user.defaultSavingsTarget) / 100);
    const months = Math.ceil((user.emergencyFundTarget - user.emergencyFundCurrent) / monthly);
    if (months <= 60)
      items.push({
        id: "emergency-fund",
        date: addMonths(now, months).toISOString(),
        title: t("Emergency fund fully funded"),
        description: t("Projected at your {pct}% savings target.", { pct: user.defaultSavingsTarget }),
        type: "emergency_fund",
        icon: "ShieldCheck",
        amount: user.emergencyFundTarget,
      });
  }
  return items
    .filter((i) => differenceInCalendarDays(new Date(i.date), now) >= -30)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

export function generateInsights(args: {
  user: UserProfile;
  transactions: Transaction[];
  budgets: BudgetCategory[];
  goals: FinancialGoal[];
  purchases: PurchaseGoal[];
  now?: Date;
}): Insight[] {
  const { user, transactions, budgets, goals, purchases, now = new Date() } = args;
  const out: Insight[] = [];
  const push = (i: Omit<Insight, "id">) => out.push({ ...i, id: `${i.category}-${out.length}` });

  const [prev, curr] = monthlyCashflow(transactions, 2, now);
  const catSpend = (offset: number) => {
    const key = format(subMonths(now, offset), "yyyy-MM");
    const m = new Map<string, number>();
    for (const t of transactions)
      if (t.type === "expense" && format(new Date(t.date), "yyyy-MM") === key) for (const p of categoryParts(t)) m.set(p.category, (m.get(p.category) ?? 0) + p.amount);
    return m;
  };
  const thisMonth = catSpend(0);
  const lastMonth = catSpend(1);

  // Spending
  if (curr.expenses > 0 && prev.expenses > 0) {
    const change = Math.round(((curr.expenses - prev.expenses) / prev.expenses) * 100);
    push({
      category: "spending",
      severity: change > 10 ? "warning" : change < -5 ? "positive" : "neutral",
      title: change >= 0 ? t("Spending up {pct}% vs last month", { pct: change }) : t("Spending down {pct}% vs last month", { pct: Math.abs(change) }),
      description: t("{current} so far this month compared with {previous} last month.", { current: formatCurrency(curr.expenses), previous: formatCurrency(prev.expenses) }),
    });
  }
  const top = [...thisMonth.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && curr.expenses > 0) {
    push({
      category: "spending",
      severity: "neutral",
      title: t("{category} is your biggest expense", { category: t(top[0]) }),
      description: t("{amount} — {pct}% of this month's spending.", { amount: formatCurrency(top[1]), pct: Math.round((top[1] / curr.expenses) * 100) }),
    });
  }
  for (const [cat, amt] of thisMonth) {
    const before = lastMonth.get(cat) ?? 0;
    if (before > 0 && amt > before * 1.3 && amt - before > 500)
      push({
        category: "spending",
        severity: "warning",
        title: t("{category} jumped {pct}%", { category: t(cat), pct: Math.round(((amt - before) / before) * 100) }),
        description: t("{before} last month → {after} this month.", { before: formatCurrency(before), after: formatCurrency(amt) }),
      });
  }

  for (const { transaction: tx, typical } of findUnusualExpenses(transactions, now).slice(0, 2))
    push({
      category: "spending",
      severity: "warning",
      title: t("Unusual expense: {title}", { title: tx.title }),
      description: t("{amount} on {date} — about {times}× your usual {category} spend.", {
        amount: formatCurrency(tx.amount),
        date: formatDate(tx.date, "MMM d"),
        times: Math.round(tx.amount / typical),
        category: t(tx.category),
      }),
    });

  // Savings
  const income = curr.income || user.monthlySalary;
  if (income > 0) {
    const rate = Math.round(((income - curr.expenses) / income) * 100);
    push({
      category: "savings",
      severity: rate >= user.defaultSavingsTarget ? "positive" : rate >= 0 ? "neutral" : "warning",
      title: t("Saving {pct}% of income this month", { pct: rate }),
      description:
        rate >= user.defaultSavingsTarget
          ? t("You're beating your {pct}% savings target. Keep it up!", { pct: user.defaultSavingsTarget })
          : t("Your target is {pct}%. Trimming discretionary spend closes the gap.", { pct: user.defaultSavingsTarget }),
    });
  }
  if (user.emergencyFundTarget > 0) {
    const pct = Math.round((user.emergencyFundCurrent / user.emergencyFundTarget) * 100);
    push({
      category: "savings",
      severity: pct >= 100 ? "positive" : pct >= 50 ? "neutral" : "warning",
      title: t("Emergency fund {pct}% funded", { pct: Math.min(pct, 100) }),
      description: t("{current} of {target}.", { current: formatCurrency(user.emergencyFundCurrent), target: formatCurrency(user.emergencyFundTarget) }),
    });
  }

  // Budget
  for (const b of budgets) {
    const status = getBudgetStatus(b.spent, b.budgeted);
    const projected = projectMonthEnd(b.spent, now);
    if (status === "on_track" && projected !== null && projected > b.budgeted * 1.1) {
      push({
        category: "budget",
        severity: "warning",
        title: t("{category} is on pace to go over budget", { category: t(b.category) }),
        description: t("At this rate you'll spend about {projected} against a {budget} budget.", { projected: formatCurrency(projected), budget: formatCurrency(b.budgeted) }),
      });
      continue;
    }
    if (status === "on_track") continue;
    push({
      category: "budget",
      severity: "warning",
      title: status === "over_budget" ? t("{category} is over budget", { category: t(b.category) }) : t("{category} is near its limit", { category: t(b.category) }),
      description: t("{spent} spent of {budget} ({pct}%).", { spent: formatCurrency(b.spent), budget: formatCurrency(b.budgeted), pct: Math.round((b.spent / b.budgeted) * 100) }),
    });
  }
  const unbudgeted = [...thisMonth.keys()].filter((c) => !budgets.some((b) => b.category === c));
  if (unbudgeted.length)
    push({
      category: "budget",
      severity: "neutral",
      title: t("{count} spending categories have no budget", { count: unbudgeted.length }),
      description: t("Add a budget for {categories} to track them properly.", { categories: unbudgeted.slice(0, 3).map((c) => t(c)).join(", ") }),
    });

  // Goals
  for (const g of goals) {
    const status = getGoalStatus(g);
    if (status === "completed")
      push({ category: "goals", severity: "positive", title: t("{name} is complete 🎉", { name: g.name }), description: t("You reached {amount}.", { amount: formatCurrency(g.goalAmount) }) });
    else if (status === "behind")
      push({
        category: "goals",
        severity: "warning",
        title: t("{name} is behind schedule", { name: g.name }),
        description: t("Raise the monthly contribution above {amount} or move the target date.", { amount: formatCurrency(g.monthlyContribution) }),
      });
  }

  // Purchases
  for (const p of purchases) {
    const remaining = p.price - p.savedAmount;
    if (remaining <= 0)
      push({ category: "purchases", severity: "positive", title: t("{name} is fully saved", { name: p.name }), description: t("You can buy it without touching other savings.") });
    else if (remaining <= user.currentSavings * 0.2)
      push({
        category: "purchases",
        severity: "positive",
        title: t("{name} is within reach", { name: p.name }),
        description: t("Only {amount} left — under 20% of your current savings.", { amount: formatCurrency(remaining) }),
      });
    else if (differenceInCalendarDays(new Date(p.desiredDate), now) < 30)
      push({
        category: "purchases",
        severity: "warning",
        title: t("{name} is due soon", { name: p.name }),
        description: t("{amount} still needed before {date}.", { amount: formatCurrency(remaining), date: formatDate(p.desiredDate, "MMM d") }),
      });
  }

  return out;
}
