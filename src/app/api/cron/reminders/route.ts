import { db } from "@/lib/server/db";
import { json } from "@/lib/server/api";
import { cronGuard } from "@/lib/server/cron";
import { sendPush } from "@/lib/server/push";
import { translate } from "@/lib/i18n";
import { appUrl, planEndingEmail, reminderEmail, sendEmail } from "@/lib/server/email";
import { PLANS } from "@/lib/plans";
import { formatCurrency } from "@/lib/currency";
import type { Currency } from "@/types/finance";

const DAY = 24 * 60 * 60 * 1000;
const REMIND_DAYS_AHEAD = 3;

// Called once a day by a scheduler (vercel.json, or any cron hitting this URL with the secret).
// Emails each user one digest of bills due in the next few days, once per due date.
export async function GET(req: Request) {
  const denied = cronGuard(req);
  if (denied) return denied;

  const now = new Date();
  const until = new Date(now.getTime() + REMIND_DAYS_AHEAD * DAY);
  const due = await db.commitment.findMany({
    where: { type: "expense", autoPost: false, dueDate: { gte: new Date(now.getTime() - DAY), lte: until } },
    include: { user: { select: { id: true, email: true, name: true, language: true, currency: true } } },
    orderBy: { dueDate: "asc" },
  });
  const pending = due.filter((c) => c.lastRemindedFor?.getTime() !== c.dueDate.getTime());

  const byUser = new Map<string, typeof pending>();
  for (const c of pending) byUser.set(c.userId, [...(byUser.get(c.userId) ?? []), c]);

  const base = await appUrl();
  let sent = 0;
  for (const items of byUser.values()) {
    const { user } = items[0];
    const lang = user.language === "bn" ? "bn" : "en";
    const locale = lang === "bn" ? "bn-BD" : "en-GB";
    try {
      await sendEmail({
        to: user.email,
        ...reminderEmail(
          lang,
          user.name,
          items.map((c) => ({
            title: c.title,
            amount: formatCurrency(c.amount, { currency: user.currency as Currency }),
            due: c.dueDate.toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "UTC" }),
          })),
          `${base}/recurring`
        ),
      });
      await sendPush(user.id, {
        title: translate(lang, "Upcoming payments on Sanchay"),
        body: items.map((c) => `${c.title}: ${formatCurrency(c.amount, { currency: user.currency as Currency })}`).join(" · "),
        url: "/recurring",
      }).catch((err) => console.error("[reminders push]", err));
      await db.$transaction(items.map((c) => db.commitment.update({ where: { id: c.id }, data: { lastRemindedFor: c.dueDate } })));
      sent += 1;
    } catch (err) {
      console.error("[reminders]", user.id, err);
    }
  }
  // Plan renewal reminders: once per period, three days before Pro ends.
  const planEnding = await db.user.findMany({
    where: { plan: "pro", planExpiresAt: { gt: now, lte: new Date(now.getTime() + 3 * DAY) } },
    select: { id: true, email: true, name: true, language: true, planExpiresAt: true, planReminderFor: true },
  });
  let planReminders = 0;
  for (const u of planEnding) {
    if (!u.planExpiresAt || u.planReminderFor?.getTime() === u.planExpiresAt.getTime()) continue;
    const paid = await db.planGrant.count({ where: { userId: u.id, amount: { gt: 0 } } });
    const lang = u.language === "bn" ? "bn" : "en";
    try {
      await sendEmail({
        to: u.email,
        ...planEndingEmail(
          lang,
          u.name,
          {
            trial: paid === 0,
            date: u.planExpiresAt.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", timeZone: "Asia/Dhaka" }),
            price: `৳${PLANS.pro.priceMonthly}`,
          },
          `${base}/billing`
        ),
      });
      await db.user.update({ where: { id: u.id }, data: { planReminderFor: u.planExpiresAt } });
      planReminders++;
    } catch (err) {
      console.error("[plan reminder]", u.id, err);
    }
  }

  return json({ users: byUser.size, sent, planReminders });
}
