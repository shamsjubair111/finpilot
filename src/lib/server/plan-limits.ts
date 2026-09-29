import "server-only";
import { ApiError } from "./api";
import { db } from "./db";
import { effectivePlan, PLANS, RESOURCE_LABELS, type LimitedResource } from "@/lib/plans";

const counters: Record<LimitedResource, (userId: string) => Promise<number>> = {
  accounts: (userId) => db.account.count({ where: { userId, archived: false } }),
  goals: (userId) => db.goal.count({ where: { userId } }),
  budgets: (userId) => db.budgetCategory.count({ where: { userId } }),
  purchases: (userId) => db.purchase.count({ where: { userId } }),
};

export async function assertWithinLimit(userId: string, resource: LimitedResource) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { plan: true, planExpiresAt: true } });
  const limit = PLANS[effectivePlan(user.plan, user.planExpiresAt)].limits[resource];
  if (!Number.isFinite(limit)) return;
  if ((await counters[resource](userId)) >= limit)
    throw new ApiError(402, `The Free plan allows ${limit} ${RESOURCE_LABELS[resource]}. Upgrade to Pro for unlimited.`);
}

export const limitCheck = (resource: LimitedResource) => async (_data: unknown, userId: string) =>
  assertWithinLimit(userId, resource);
