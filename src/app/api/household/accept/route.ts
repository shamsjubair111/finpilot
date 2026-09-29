import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";

const INVITE_DAYS = 7;

export const POST = authed(async ({ actorId, req }) => {
  await rateLimit("household-accept", 10, 15 * 60 * 1000, actorId);
  const { token } = z.object({ token: z.string().min(10).max(200) }).parse(await req.json());
  const invite = await db.membership.findUnique({
    where: { inviteHash: createHash("sha256").update(token).digest("hex") },
    include: { owner: { select: { id: true, name: true } } },
  });
  if (!invite || invite.createdAt.getTime() < Date.now() - INVITE_DAYS * 86400000) throw new ApiError(400, "This invitation is invalid or has expired. Ask for a new one.");
  const me = await db.user.findUniqueOrThrow({ where: { id: actorId }, select: { email: true } });
  // Invitations are personal: only the invited email address can accept.
  if (me.email !== invite.email) throw new ApiError(403, "This invitation was sent to a different email address. Sign in with that address to accept.");
  if (invite.ownerId === actorId) throw new ApiError(400, "You can't invite yourself.");
  await db.membership.update({ where: { id: invite.id }, data: { memberId: actorId, acceptedAt: new Date(), inviteHash: null } });
  return json({ ownerId: invite.owner.id, ownerName: invite.owner.name, role: invite.role });
});
