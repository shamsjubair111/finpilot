import { z } from "zod";
import { db } from "@/lib/server/db";
import { json } from "@/lib/server/api";
import { adminOnly } from "@/lib/server/admin";

export const PATCH = adminOnly<{ id: string }>(async ({ req, params }) => {
  const { resolved } = z.object({ resolved: z.boolean() }).parse(await req.json());
  await db.supportMessage.update({ where: { id: params.id }, data: { resolvedAt: resolved ? new Date() : null } });
  return json({ ok: true });
});
