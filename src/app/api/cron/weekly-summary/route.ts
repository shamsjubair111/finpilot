import { db } from "@/lib/server/db";
import { categoryParts, type SplitPart } from "@/lib/splits";
import { json } from "@/lib/server/api";
import { cronGuard } from "@/lib/server/cron";
import { appUrl, sendEmail, weeklySummaryEmail } from "@/lib/server/email";
import { formatCurrency } from "@/lib/currency";
import { translate } from "@/lib/i18n";
import type { Currency } from "@/types/finance";

const DAY = 24 * 60 * 60 * 1000;
const parts = (t: { category: string; amount: number; splits: unknown }) => categoryParts({ ...t, splits: Array.isArray(t.splits) ? (t.splits as SplitPart[]) : null });

// Runs weekly (vercel.json). Emails verified users who opted in and used Sanchay in the last 30 days.
export async function GET(req: Request) {
  const denied = cronGuard(req);
  if (denied) return denied;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const users = await db.user.findMany({
    where: {
      weeklySummary: true,
      emailVerifiedAt: { not: null },
      // At most one summary every 6 days, so a retried job never sends twice.
      OR: [{ weeklySummarySentAt: null }, { weeklySummarySentAt: { lt: new Date(now.getTime() - 6 * DAY) } }],
      transactions: { some: { createdAt: { gte: new Date(now.getTime() - 30 * DAY) } } },
    },
    select: { id: true, email: true, name: true, language: true, currency: true },
  });

  const base = await appUrl();
  let sent = 0;
  for (const user of users) {
    try {
      const [txns, budgets, bills] = await Promise.all([
        db.transaction.findMany({ where: { userId: user.id, date: { gte: monthStart < weekAgo ? monthStart : weekAgo, lte: now } }, select: { date: true, amount: true, type: true, category: true, splits: true } }),
        db.budgetCategory.findMany({ where: { userId: user.id }, select: { category: true, budgeted: true } }),
        db.commitment.findMany({ where: { userId: user.id, type: "expense", dueDate: { gte: now, lte: new Date(now.getTime() + 7 * DAY) } }, select: { amount: true } }),
      ]);
      const lang = user.language === "bn" ? "bn" : "en";
      const money = (n: number) => formatCurrency(n, { currency: user.currency as Currency });
      const week = txns.filter((t) => t.date >= weekAgo);
      const byCat = new Map<string, number>();
      for (const t of week) if (t.type === "expense") for (const p of parts(t)) byCat.set(p.category, (byCat.get(p.category) ?? 0) + p.amount);
      const monthSpend = new Map<string, number>();
      for (const t of txns) if (t.type === "expense" && t.date >= monthStart) for (const p of parts(t)) monthSpend.set(p.category, (monthSpend.get(p.category) ?? 0) + p.amount);
      const billsTotal = bills.reduce((s, b) => s + b.amount, 0);

      await sendEmail({
        to: user.email,
        ...weeklySummaryEmail(
          lang,
          user.name,
          {
            income: money(week.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)),
            expenses: money(week.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)),
            top: [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, a]) => `${translate(lang, c)} (${money(a)})`),
            overBudget: budgets.filter((b) => (monthSpend.get(b.category) ?? 0) > b.budgeted).map((b) => translate(lang, b.category)),
            billsDue: billsTotal > 0 ? money(billsTotal) : null,
          },
          base
        ),
      });
      await db.user.update({ where: { id: user.id }, data: { weeklySummarySentAt: now } });
      sent += 1;
    } catch (err) {
      console.error("[weekly-summary]", user.id, err);
    }
  }
  // Housekeeping: keep six months of security activity.
  await db.auditEvent.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 180 * DAY) } } });
  await db.errorEvent.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 30 * DAY) } } });
  return json({ users: users.length, sent });
}
