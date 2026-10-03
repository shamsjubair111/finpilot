import { db } from "@/lib/server/db";
import { json } from "@/lib/server/api";
import { adminOnly } from "@/lib/server/admin";

export const GET = adminOnly(async ({ req }) => {
  const all = new URL(req.url).searchParams.get("all") === "1";
  const messages = await db.supportMessage.findMany({ where: all ? {} : { resolvedAt: null }, orderBy: { createdAt: "desc" }, take: 100 });
  return json(messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString(), resolvedAt: m.resolvedAt?.toISOString() ?? null })));
});
