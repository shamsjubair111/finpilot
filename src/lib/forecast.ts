import { nextDueDate, type Frequency } from "@/lib/recurrence";

export interface ForecastItem {
  title: string;
  amount: number;
  type: "income" | "expense";
  dueDate: string;
  recurring: boolean;
  frequency?: Frequency | null;
  anchorDay?: number | null;
}

export interface ForecastPoint {
  date: Date;
  balance: number;
  events: { title: string; amount: number }[];
}

const DAY = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Day-by-day projection of spendable money: today's liquid balance, plus expected income, minus bills,
 * repeating recurring items within the window. Overdue items count today (they still have to be paid).
 */
export function forecastCashflow(startBalance: number, items: ForecastItem[], days = 30, now = new Date()) {
  const today = startOfDay(now);
  const end = new Date(today.getTime() + days * DAY);
  const byDay = new Map<number, { title: string; amount: number }[]>();
  for (const item of items) {
    let due = new Date(item.dueDate);
    for (let i = 0; i < 60 && due < end; i++) {
      const day = Math.max(startOfDay(due).getTime(), today.getTime());
      const signed = item.type === "income" ? item.amount : -item.amount;
      byDay.set(day, [...(byDay.get(day) ?? []), { title: item.title, amount: signed }]);
      if (!item.recurring) break;
      due = nextDueDate(due, item.frequency ?? "monthly", item.anchorDay);
    }
  }
  const points: ForecastPoint[] = [];
  let balance = startBalance;
  for (let d = 0; d <= days; d++) {
    const date = new Date(today.getTime() + d * DAY);
    const events = byDay.get(date.getTime()) ?? [];
    balance += events.reduce((s, e) => s + e.amount, 0);
    points.push({ date, balance: Math.round(balance * 100) / 100, events });
  }
  const lowest = points.reduce((min, p) => (p.balance < min.balance ? p : min), points[0]);
  return { points, lowest, end: points[points.length - 1].balance, shortfall: lowest.balance < 0 };
}
