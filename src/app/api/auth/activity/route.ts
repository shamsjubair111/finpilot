import { db } from "@/lib/server/db";
import { authed, json } from "@/lib/server/api";

export const GET = authed(async ({ userId }) => {
  const events = await db.auditEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 15 });
  return json(events.map((e) => ({ id: e.id, action: e.action, ip: e.ip, userAgent: e.userAgent, createdAt: e.createdAt.toISOString() })));
});
