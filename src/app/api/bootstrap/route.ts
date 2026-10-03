import { db } from "@/lib/server/db";
import { authed, json } from "@/lib/server/api";
import { serialize } from "@/lib/server/crud";
import { toProfile } from "@/lib/server/user";
import { processAutoPost } from "@/lib/server/recurring";
import { effectivePlan } from "@/lib/plans";

// Only the columns the app uses: fetching whole rows is several times slower for large histories.
const TRANSACTION_FIELDS = {
  id: true,
  title: true,
  merchant: true,
  category: true,
  date: true,
  amount: true,
  type: true,
  paymentMethod: true,
  notes: true,
  accountId: true,
  toAccountId: true,
  externalId: true,
  originalAmount: true,
  originalCurrency: true,
  splits: true,
} as const;

export const GET = authed(
  async ({ userId, actorId, role }) => {
    const t0 = performance.now();
    const loadTransactions = () => db.transaction.findMany({ where: { userId }, orderBy: { date: "desc" }, select: TRANSACTION_FIELDS });
    // Catch up on auto-post bills alongside loading; never block loading the app on it.
    const autoPost = processAutoPost(userId).catch((err) => {
      console.error("[auto-post]", err);
      return 0;
    });
    const [owner, firstTransactions, receipts, actor, households, posted] = await Promise.all([
      db.user.findUniqueOrThrow({
        where: { id: userId },
        include: {
          budgets: { orderBy: { createdAt: "asc" } },
          goals: { orderBy: { createdAt: "asc" } },
          purchases: { orderBy: { createdAt: "asc" } },
          commitments: { orderBy: { dueDate: "asc" } },
          accounts: { orderBy: { createdAt: "asc" } },
          investments: { orderBy: { startDate: "asc" } },
          customCategories: { orderBy: { name: "asc" } },
        },
      }),
      loadTransactions(),
      // Receipt flags in one small query instead of a join per transaction.
      db.receipt.findMany({ where: { userId }, select: { transactionId: true } }),
      userId === actorId ? null : db.user.findUniqueOrThrow({ where: { id: actorId } }),
      db.membership.findMany({
        where: { memberId: actorId, acceptedAt: { not: null } },
        select: { role: true, owner: { select: { id: true, name: true } } },
      }),
      autoPost,
    ]);
    // Rare: something was just auto-posted, so read transactions again (bills moved to their next date too).
    const transactions = posted ? await loadTransactions() : firstTransactions;
    const commitments = posted ? await db.commitment.findMany({ where: { userId }, orderBy: { dueDate: "asc" } }) : owner.commitments;

    const t2 = performance.now();
    const withReceipt = new Set(receipts.map((r) => r.transactionId));

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
          exchangeRates: toProfile(owner).exchangeRates,
        }
      : toProfile(owner);

    const body = {
      user: profile,
      ledger: {
        ownerId: owner.id,
        ownerName: owner.name,
        role,
        // Plan limits and Pro features in a shared household follow the owner's plan.
        plan: effectivePlan(owner.plan, owner.planExpiresAt),
      },
      households: households.map((h) => ({ ownerId: h.owner.id, ownerName: h.owner.name, role: h.role })),
      transactions: transactions.map((t) => ({ ...serialize(t), hasReceipt: withReceipt.has(t.id) })),
      budgets: owner.budgets.map(serialize),
      goals: owner.goals.map(serialize),
      purchases: owner.purchases.map(serialize),
      commitments: commitments.map(serialize),
      accounts: owner.accounts.map(serialize),
      investments: owner.investments.map(serialize),
      customCategories: owner.customCategories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
    };
    const t3 = performance.now();
    const res = json(body);
    // Visible in the browser's network panel; helps spot slow loads for big accounts.
    res.headers.set("Server-Timing", `db;dur=${(t2 - t0).toFixed(0)}, build;dur=${(t3 - t2).toFixed(0)}${posted ? ", autopost" : ""}`);
    return res;
  },
  { scope: "ledger" }
);
