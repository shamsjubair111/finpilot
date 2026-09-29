import { z } from "zod";
import { db } from "@/lib/server/db";
import { authed, json } from "@/lib/server/api";
import { toProfile } from "@/lib/server/user";
import { accountSchema, budgetSchema, profileSchema } from "@/lib/validation";
import { CATEGORY_ICON_MAP } from "@/lib/constants";
import { CATEGORY_COLORS } from "@/lib/chart-colors";

// Everything is optional so "Skip" can finish onboarding with an empty body.
const schema = z.object({
  profile: profileSchema.pick({ monthlySalary: true, currentSavings: true, emergencyFundTarget: true }).optional(),
  account: accountSchema.pick({ name: true, type: true, openingBalance: true }).optional(),
  budgets: z.array(budgetSchema.pick({ category: true, budgeted: true })).max(8).optional(),
});

export const POST = authed(async ({ userId, req }) => {
  const { profile, account, budgets } = schema.parse(await req.json());
  const user = await db.$transaction(async (tx) => {
    // Only seed data the first time, so a double submit can't create duplicates.
    const current = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { onboardedAt: true } });
    if (!current.onboardedAt) {
      if (account) await tx.account.create({ data: { ...account, userId } });
      const existing = new Set((await tx.budgetCategory.findMany({ where: { userId }, select: { category: true } })).map((b) => b.category));
      const fresh = (budgets ?? []).filter((b) => !existing.has(b.category));
      if (fresh.length) await tx.budgetCategory.createMany({
          data: fresh.map((b) => ({
            ...b,
            userId,
            icon: CATEGORY_ICON_MAP[b.category] ?? "Wallet",
            color: (CATEGORY_COLORS as Record<string, string>)[b.category] ?? "#6366f1",
          })),
        });
    }
    return tx.user.update({ where: { id: userId }, data: { ...profile, onboardedAt: current.onboardedAt ?? new Date() } });
  });
  return json(toProfile(user));
});
