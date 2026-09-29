import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";

// Owner changes a member's access.
export const PATCH = authed<{ id: string }>(async ({ actorId, req, params }) => {
  const { role } = z.object({ role: z.enum(["editor", "viewer"]) }).parse(await req.json());
  const { count } = await db.membership.updateMany({ where: { id: params.id, ownerId: actorId }, data: { role } });
  if (!count) throw new ApiError(404, "Not found. It may have already been deleted.");
  return json({ ok: true });
});

// Owner removes someone (or cancels an invite), or a member leaves a household.
export const DELETE = authed<{ id: string }>(async ({ actorId, params }) => {
  const { count } = await db.membership.deleteMany({ where: { id: params.id, OR: [{ ownerId: actorId }, { memberId: actorId }] } });
  if (!count) throw new ApiError(404, "Not found. It may have already been deleted.");
  return json({ ok: true });
});
