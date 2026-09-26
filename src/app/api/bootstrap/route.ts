import { db } from "@/lib/server/db";
import { authed, json } from "@/lib/server/api";
import { serialize } from "@/lib/server/crud";
import { toProfile } from "@/lib/server/user";

export const GET = authed(async ({ userId }) => {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      transactions: { orderBy: { date: "desc" } },
      budgets: { orderBy: { createdAt: "asc" } },
      goals: { orderBy: { createdAt: "asc" } },
      purchases: { orderBy: { createdAt: "asc" } },
      commitments: { orderBy: { dueDate: "asc" } },
    },
  });
  return json({
    user: toProfile(user),
    transactions: user.transactions.map(serialize),
    budgets: user.budgets.map(serialize),
    goals: user.goals.map(serialize),
    purchases: user.purchases.map(serialize),
    commitments: user.commitments.map(serialize),
  });
});
