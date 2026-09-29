export const FREQUENCIES = ["weekly", "monthly", "quarterly", "yearly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

const MONTHS: Record<Exclude<Frequency, "weekly">, number> = { monthly: 1, quarterly: 3, yearly: 12 };

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/**
 * The next due date after `date`. Month-based schedules return to `anchorDay` when the month allows,
 * so a bill on the 31st goes 31 Jan → 28 Feb → 31 Mar instead of drifting to the 28th.
 * Works in UTC because due dates are stored as UTC midnights.
 */
export function nextDueDate(date: Date, frequency: Frequency, anchorDay?: number | null): Date {
  if (frequency === "weekly") return new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
  const total = date.getUTCMonth() + MONTHS[frequency];
  const year = date.getUTCFullYear() + Math.floor(total / 12);
  const month = total % 12;
  const day = Math.min(anchorDay ?? date.getUTCDate(), daysInMonth(year, month));
  return new Date(Date.UTC(year, month, day, date.getUTCHours(), date.getUTCMinutes()));
}

/** Every due date from `from` up to and including `until`, capped so a long-forgotten schedule can't flood the ledger. */
export function dueDatesUntil(from: Date, until: Date, frequency: Frequency, anchorDay?: number | null, cap = 36) {
  const dates: Date[] = [];
  let d = from;
  while (d <= until && dates.length < cap) {
    dates.push(d);
    d = nextDueDate(d, frequency, anchorDay);
  }
  return { dates, next: d };
}

/** Commitment categories that aren't transaction categories fall back to the closest one. */
export function transactionCategoryFor(category: string, type: "income" | "expense") {
  if (type === "income") return ["Salary", "Freelance", "Bonus", "Investment"].includes(category) ? category : "Other";
  return ["Housing", "Food", "Transport", "Shopping", "Entertainment", "Bills", "Subscriptions", "Health", "Education"].includes(category)
    ? category
    : "Other";
}
