import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, authed, json, LEDGER_COOKIE } from "@/lib/server/api";

// Chooses whose finances the app shows: null = my own.
export const POST = authed(async ({ actorId, req }) => {
  const { ownerId } = z.object({ ownerId: z.string().min(1).max(64).nullable() }).parse(await req.json());
  const jar = await cookies();
  if (!ownerId || ownerId === actorId) {
    jar.delete(LEDGER_COOKIE);
    return json({ ok: true });
  }
  const allowed = await db.membership.findFirst({ where: { ownerId, memberId: actorId, acceptedAt: { not: null } } });
  if (!allowed) throw new ApiError(403, "You don't have access to that household.");
  jar.set(LEDGER_COOKIE, ownerId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return json({ ok: true });
});
