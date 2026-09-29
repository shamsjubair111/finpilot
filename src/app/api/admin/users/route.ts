import { db } from "@/lib/server/db";
import { json } from "@/lib/server/api";
import { adminOnly } from "@/lib/server/admin";
import { effectivePlan } from "@/lib/plans";

const PAGE_SIZE = 25;

export const GET = adminOnly(async ({ req }) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const where = q ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { name: { contains: q, mode: "insensitive" as const } }] } : {};

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, name: true, email: true, createdAt: true, plan: true, planExpiresAt: true,
        emailVerifiedAt: true, onboardedAt: true, language: true, currency: true,
        _count: { select: { transactions: true, accounts: true } },
      },
    }),
  ]);

  const grants = await db.planGrant.findMany({
    where: { userId: { in: users.map((u) => u.id) } },
    orderBy: { createdAt: "desc" },
    select: { userId: true, days: true, amount: true, currency: true, reference: true, createdAt: true },
  });

  return json({
    total,
    page,
    pageSize: PAGE_SIZE,
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt.toISOString(),
      plan: effectivePlan(u.plan, u.planExpiresAt),
      planExpiresAt: u.plan === "pro" ? u.planExpiresAt?.toISOString() ?? null : null,
      verified: !!u.emailVerifiedAt,
      onboarded: !!u.onboardedAt,
      language: u.language,
      currency: u.currency,
      transactions: u._count.transactions,
      accounts: u._count.accounts,
      grants: grants.filter((g) => g.userId === u.id).map((g) => ({ ...g, createdAt: g.createdAt.toISOString() })),
    })),
  });
});
