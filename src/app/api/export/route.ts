import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { authed } from "@/lib/server/api";
import { serialize } from "@/lib/server/crud";
import { rateLimit } from "@/lib/server/rate-limit";
import { toProfile } from "@/lib/server/user";
import { transactionsCsv } from "@/lib/csv-export";

export const GET = authed(async ({ userId, req }) => {
  await rateLimit("export", 10, 60 * 60 * 1000, userId);
  await audit(userId, "data_exported");
  const format = new URL(req.url).searchParams.get("format") === "csv" ? "csv" : "json";
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      accounts: { orderBy: { createdAt: "asc" } },
      investments: { orderBy: { startDate: "asc" } },
      transactions: { orderBy: { date: "desc" } },
      budgets: { orderBy: { createdAt: "asc" } },
      goals: { orderBy: { createdAt: "asc" } },
      purchases: { orderBy: { createdAt: "asc" } },
      personalLoans: { orderBy: { date: "asc" } },
      commitments: { orderBy: { dueDate: "asc" } },
    },
  });
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const names = new Map(user.accounts.map((a) => [a.id, a.name]));
    return new Response(transactionsCsv(user.transactions, names), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sanchay-transactions-${stamp}.csv"`,
      },
    });
  }

  const body = {
    exportedAt: new Date().toISOString(),
    profile: toProfile(user),
    accounts: user.accounts.map(serialize),
    investments: user.investments.map(serialize),
    transactions: user.transactions.map(serialize),
    budgets: user.budgets.map(serialize),
    goals: user.goals.map(serialize),
    purchases: user.purchases.map(serialize),
    personalLoans: user.personalLoans.map(serialize),
    commitments: user.commitments.map(serialize),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sanchay-export-${stamp}.json"`,
    },
  });
});
