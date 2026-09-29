import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { authed } from "@/lib/server/api";
import { serialize } from "@/lib/server/crud";
import { rateLimit } from "@/lib/server/rate-limit";
import { toProfile } from "@/lib/server/user";

const CSV_COLUMNS = ["date", "type", "title", "merchant", "category", "amount", "paymentMethod", "account", "toAccount", "notes"] as const;

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  // Quote everything and neutralise leading formula characters so spreadsheets don't execute them.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

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
      commitments: { orderBy: { dueDate: "asc" } },
    },
  });
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const names = new Map(user.accounts.map((a) => [a.id, a.name]));
    const lines = [
      CSV_COLUMNS.join(","),
      ...user.transactions.map((t) =>
        [t.date.toISOString(), t.type, t.title, t.merchant, t.category, t.amount, t.paymentMethod, names.get(t.accountId ?? ""), names.get(t.toAccountId ?? ""), t.notes]
          .map(csvCell)
          .join(",")
      ),
    ];
    return new Response("﻿" + lines.join("\r\n"), {
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
    commitments: user.commitments.map(serialize),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sanchay-export-${stamp}.json"`,
    },
  });
});
