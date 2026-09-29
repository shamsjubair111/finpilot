import { db } from "@/lib/server/db";
import { json } from "@/lib/server/api";
import { adminOnly } from "@/lib/server/admin";

export const GET = adminOnly(async () => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [events, count24h] = await Promise.all([
    db.errorEvent.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.errorEvent.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);
  return json({ count24h, events: events.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })) });
});
