import { db } from "@/lib/server/db";
import { json } from "@/lib/server/api";
import { adminOnly } from "@/lib/server/admin";

const DAY = 24 * 60 * 60 * 1000;

export const GET = adminOnly(async () => {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY);
  const since7 = new Date(now.getTime() - 7 * DAY);
  const activePro = { plan: "pro", OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: now } }] };

  const [totalUsers, new7, new30, verified, onboarded, proActive, recentUsers, grants30, payingIds, expiredRecently, activeTxnUsers] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: since7 } } }),
    db.user.count({ where: { createdAt: { gte: since30 } } }),
    db.user.count({ where: { emailVerifiedAt: { not: null } } }),
    db.user.count({ where: { onboardedAt: { not: null } } }),
    db.user.findMany({ where: activePro, select: { id: true } }),
    db.user.findMany({ where: { createdAt: { gte: since30 } }, select: { createdAt: true } }),
    db.planGrant.findMany({ where: { createdAt: { gte: since30 }, amount: { gt: 0 } }, select: { amount: true, currency: true } }),
    db.planGrant.findMany({ where: { amount: { gt: 0 } }, select: { userId: true }, distinct: ["userId"] }),
    db.user.findMany({ where: { plan: "pro", planExpiresAt: { gte: since30, lte: now } }, select: { id: true } }),
    db.transaction.findMany({ where: { createdAt: { gte: since30 } }, select: { userId: true }, distinct: ["userId"] }),
  ]);

  // Paying = has ever recorded a payment. Everyone else on Pro is on a trial or a free grant.
  const payers = new Set(payingIds.map((g) => g.userId));
  const paidActive = proActive.filter((u) => payers.has(u.id)).length;
  const churned30 = expiredRecently.filter((u) => payers.has(u.id)).length;

  const revenue30: Record<string, number> = {};
  for (const g of grants30) revenue30[g.currency] = (revenue30[g.currency] ?? 0) + g.amount;

  const signups: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    signups.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  const index = new Map(signups.map((s, i) => [s.date, i]));
  for (const u of recentUsers) {
    const i = index.get(u.createdAt.toISOString().slice(0, 10));
    if (i !== undefined) signups[i].count += 1;
  }

  return json({
    totalUsers,
    new7,
    new30,
    verified,
    onboarded,
    proActive: proActive.length,
    paidActive,
    trialOrFreePro: proActive.length - paidActive,
    churned30,
    activeUsers30: activeTxnUsers.length,
    revenue30,
    signups,
  });
});
