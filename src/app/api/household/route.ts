import { db } from "@/lib/server/db";
import { authed, json } from "@/lib/server/api";

// People in my household, and households I've joined.
export const GET = authed(async ({ actorId }) => {
  const [members, joined] = await Promise.all([
    db.membership.findMany({ where: { ownerId: actorId }, orderBy: { createdAt: "asc" }, include: { member: { select: { name: true } } } }),
    db.membership.findMany({ where: { memberId: actorId, acceptedAt: { not: null } }, include: { owner: { select: { id: true, name: true, email: true } } } }),
  ]);
  return json({
    members: members.map((m) => ({ id: m.id, email: m.email, name: m.member?.name ?? null, role: m.role, accepted: !!m.acceptedAt, createdAt: m.createdAt.toISOString() })),
    joined: joined.map((m) => ({ id: m.id, ownerId: m.owner.id, ownerName: m.owner.name, ownerEmail: m.owner.email, role: m.role })),
  });
});
