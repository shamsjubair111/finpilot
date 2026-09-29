import { db } from "@/lib/server/db";
import { authed, json } from "@/lib/server/api";
import { serialize } from "@/lib/server/crud";
import { toProfile } from "@/lib/server/user";
import { processAutoPost } from "@/lib/server/recurring";
import { effectivePlan } from "@/lib/plans";

export const GET = authed(
  async ({ userId, actorId, role }) => {
    // Catch up on bills and income set to post automatically; never block loading the app on it.
    await processAutoPost(userId).catch((err) => console.error("[auto-post]", err));
    const [owner, actor, households] = await Promise.all([
      db.user.findUniqueOrThrow({
        where: { id: userId },
        include: {
          transactions: { orderBy: { date: "desc" } },
          budgets: { orderBy: { createdAt: "asc" } },
          goals: { orderBy: { createdAt: "asc" } },
          purchases: { orderBy: { createdAt: "asc" } },
          commitments: { orderBy: { dueDate: "asc" } },
          accounts: { orderBy: { createdAt: "asc" } },
          investments: { orderBy: { startDate: "asc" } },
        },
      }),
      userId === actorId ? null : db.user.findUniqueOrThrow({ where: { id: actorId } }),
      db.membership.findMany({
        where: { memberId: actorId, acceptedAt: { not: null } },
        select: { role: true, owner: { select: { id: true, name: true } } },
      }),
    ]);

    // Identity and preferences are always the signed-in person's; money settings follow the household.
    const profile = actor
      ? {
          ...toProfile(actor),
          currency: toProfile(owner).currency,
          monthlySalary: owner.monthlySalary,
          currentSavings: owner.currentSavings,
          emergencyFundTarget: owner.emergencyFundTarget,
          emergencyFundCurrent: owner.emergencyFundCurrent,
          defaultSavingsTarget: owner.defaultSavingsTarget,
        }
      : toProfile(owner);

    return json({
      user: profile,
      ledger: {
        ownerId: owner.id,
        ownerName: owner.name,
        role,
        // Plan limits and Pro features in a shared household follow the owner's plan.
        plan: effectivePlan(owner.plan, owner.planExpiresAt),
      },
      households: households.map((h) => ({ ownerId: h.owner.id, ownerName: h.owner.name, role: h.role })),
      transactions: owner.transactions.map(serialize),
      budgets: owner.budgets.map(serialize),
      goals: owner.goals.map(serialize),
      purchases: owner.purchases.map(serialize),
      commitments: owner.commitments.map(serialize),
      accounts: owner.accounts.map(serialize),
      investments: owner.investments.map(serialize),
    });
  },
  { scope: "ledger" }
);
