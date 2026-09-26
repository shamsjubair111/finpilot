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

const ESSENTIALS = ["Housing", "Bills", "Food", "Health"];

export function monthOptions(count = 12, now = new Date()) {
  return Array.from({ length: count }, (_, i) => format(subMonths(now, i), "MMMM yyyy"));
}

export function monthlyCashflow(transactions: Transaction[], months: number, end = new Date()): MonthlyFinancials[] {
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = startOfMonth(subMonths(end, months - 1 - i));
    return { key: format(d, "yyyy-MM"), month: format(d, months > 12 ? "MMM yy" : "MMM"), income: 0, expenses: 0, savings: 0 };
  });
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const t of transactions) {
    const i = index.get(format(new Date(t.date), "yyyy-MM"));
    if (i === undefined) continue;
    if (t.type === "income") buckets[i].income += t.amount;
    else buckets[i].expenses += t.amount;
  }
  return buckets.map(({ month, income, expenses }) => ({ month, income, expenses, savings: income - expenses }));
}

export function monthTotals(transactions: Transaction[], monthLabel: string) {
  let income = 0;
  let expenses = 0;
  for (const t of transactions) {
    if (format(new Date(t.date), "MMMM yyyy") !== monthLabel) continue;
    if (t.type === "income") income += t.amount;
    else expenses += t.amount;
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
      title: `${g.name} target`,
      description: `${calculateGoalProgress(g.currentAmount, g.goalAmount)}% funded — ${formatCurrency(Math.max(0, g.goalAmount - g.currentAmount))} to go.`,
      type: g.category === "emergency" ? "emergency_fund" : "goal",
      icon: g.icon,
      amount: g.goalAmount,
    });
  }
  for (const p of purchases) {
    items.push({
      id: `purchase-${p.id}`,
      date: p.desiredDate,
      title: `Buy ${p.name}`,
      description: p.notes || `${formatCurrency(p.savedAmount)} saved of ${formatCurrency(p.price)}.`,
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
      description: `${c.category}${c.recurring ? " · recurring" : ""}`,
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
        title: "Emergency fund fully funded",
        description: `Projected at your ${user.defaultSavingsTarget}% savings target.`,
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
      if (t.type === "expense" && format(new Date(t.date), "yyyy-MM") === key) m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
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
      title: change >= 0 ? `Spending up ${change}% vs last month` : `Spending down ${Math.abs(change)}% vs last month`,
      description: `${formatCurrency(curr.expenses)} so far this month compared with ${formatCurrency(prev.expenses)} last month.`,
    });
  }
  const top = [...thisMonth.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && curr.expenses > 0) {
    push({
      category: "spending",
      severity: "neutral",
      title: `${top[0]} is your biggest expense`,
      description: `${formatCurrency(top[1])} — ${Math.round((top[1] / curr.expenses) * 100)}% of this month's spending.`,
    });
  }
  for (const [cat, amt] of thisMonth) {
    const before = lastMonth.get(cat) ?? 0;
    if (before > 0 && amt > before * 1.3 && amt - before > 500)
      push({
        category: "spending",
        severity: "warning",
        title: `${cat} jumped ${Math.round(((amt - before) / before) * 100)}%`,
        description: `${formatCurrency(before)} last month → ${formatCurrency(amt)} this month.`,
      });
  }

  // Savings
  const income = curr.income || user.monthlySalary;
  if (income > 0) {
    const rate = Math.round(((income - curr.expenses) / income) * 100);
    push({
      category: "savings",
      severity: rate >= user.defaultSavingsTarget ? "positive" : rate >= 0 ? "neutral" : "warning",
      title: `Saving ${rate}% of income this month`,
      description:
        rate >= user.defaultSavingsTarget
          ? `You're beating your ${user.defaultSavingsTarget}% savings target. Keep it up!`
          : `Your target is ${user.defaultSavingsTarget}%. Trimming discretionary spend closes the gap.`,
    });
  }
  if (user.emergencyFundTarget > 0) {
    const pct = Math.round((user.emergencyFundCurrent / user.emergencyFundTarget) * 100);
    push({
      category: "savings",
      severity: pct >= 100 ? "positive" : pct >= 50 ? "neutral" : "warning",
      title: `Emergency fund ${Math.min(pct, 100)}% funded`,
      description: `${formatCurrency(user.emergencyFundCurrent)} of ${formatCurrency(user.emergencyFundTarget)}.`,
    });
  }

  // Budget
  for (const b of budgets) {
    const status = getBudgetStatus(b.spent, b.budgeted);
    if (status === "on_track") continue;
    push({
      category: "budget",
      severity: "warning",
      title: status === "over_budget" ? `${b.category} is over budget` : `${b.category} is near its limit`,
      description: `${formatCurrency(b.spent)} spent of ${formatCurrency(b.budgeted)} (${Math.round((b.spent / b.budgeted) * 100)}%).`,
    });
  }
  const unbudgeted = [...thisMonth.keys()].filter((c) => !budgets.some((b) => b.category === c));
  if (unbudgeted.length)
    push({
      category: "budget",
      severity: "neutral",
      title: `${unbudgeted.length} spending categor${unbudgeted.length === 1 ? "y has" : "ies have"} no budget`,
      description: `Add a budget for ${unbudgeted.slice(0, 3).join(", ")} to track them properly.`,
    });

  // Goals
  for (const g of goals) {
    const status = getGoalStatus(g);
    if (status === "completed")
      push({ category: "goals", severity: "positive", title: `${g.name} is complete 🎉`, description: `You reached ${formatCurrency(g.goalAmount)}.` });
    else if (status === "behind")
      push({
        category: "goals",
        severity: "warning",
        title: `${g.name} is behind schedule`,
        description: `Raise the monthly contribution above ${formatCurrency(g.monthlyContribution)} or move the target date.`,
      });
  }

  // Purchases
  for (const p of purchases) {
    const remaining = p.price - p.savedAmount;
    if (remaining <= 0)
      push({ category: "purchases", severity: "positive", title: `${p.name} is fully saved`, description: "You can buy it without touching other savings." });
    else if (remaining <= user.currentSavings * 0.2)
      push({
        category: "purchases",
        severity: "positive",
        title: `${p.name} is within reach`,
        description: `Only ${formatCurrency(remaining)} left — under 20% of your current savings.`,
      });
    else if (differenceInCalendarDays(new Date(p.desiredDate), now) < 30)
      push({
        category: "purchases",
        severity: "warning",
        title: `${p.name} is due soon`,
        description: `${formatCurrency(remaining)} still needed before ${format(new Date(p.desiredDate), "MMM d")}.`,
      });
  }

  return out;
}
