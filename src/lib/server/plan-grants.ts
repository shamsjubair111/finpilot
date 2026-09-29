import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Adds `days` of Pro, starting after any Pro time the user still has so paying early never loses days,
 * and records the grant (amount 0 for free extensions). Pass `tx` to run inside a larger transaction.
 */
export async function grantPro(
  opts: { userId: string; days: number; amount: number; currency: string; reference: string | null; grantedBy: string; source: string },
  tx: Prisma.TransactionClient = db
) {
  const user = await tx.user.findUniqueOrThrow({ where: { id: opts.userId }, select: { email: true, plan: true, planExpiresAt: true } });
  const now = Date.now();
  const from = user.plan === "pro" && user.planExpiresAt && user.planExpiresAt.getTime() > now ? user.planExpiresAt.getTime() : now;
  const planExpiresAt = new Date(from + opts.days * DAY);
  await tx.user.update({ where: { id: opts.userId }, data: { plan: "pro", planExpiresAt } });
  await tx.planGrant.create({
    data: {
      userId: opts.userId,
      email: user.email,
      plan: "pro",
      days: opts.days,
      amount: opts.amount,
      currency: opts.currency,
      reference: opts.reference,
      grantedBy: opts.grantedBy,
      source: opts.source,
    },
  });
  return planExpiresAt;
}
