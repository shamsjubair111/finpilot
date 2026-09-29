import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { appUrl, householdInviteEmail, sendEmail } from "@/lib/server/email";
import { rateLimit } from "@/lib/server/rate-limit";
import { effectivePlan } from "@/lib/plans";

const MAX_MEMBERS = 4;
const schema = z.object({ email: z.email("must be a valid email").trim().toLowerCase(), role: z.enum(["editor", "viewer"]).default("editor") });

export const POST = authed(async ({ actorId, req }) => {
  await rateLimit("household-invite", 10, 60 * 60 * 1000, actorId);
  const { email, role } = schema.parse(await req.json());
  const owner = await db.user.findUniqueOrThrow({ where: { id: actorId }, select: { name: true, email: true, plan: true, planExpiresAt: true } });
  if (effectivePlan(owner.plan, owner.planExpiresAt) !== "pro") throw new ApiError(402, "Sharing your household is part of Sanchay Pro.");
  if (email === owner.email) throw new ApiError(400, "You can't invite yourself.");
  if ((await db.membership.count({ where: { ownerId: actorId } })) >= MAX_MEMBERS) throw new ApiError(400, "A household can have up to 4 other people.");

  const token = randomBytes(24).toString("base64url");
  const inviteHash = createHash("sha256").update(token).digest("hex");
  const existing = await db.membership.findUnique({ where: { ownerId_email: { ownerId: actorId, email } } });
  if (existing?.acceptedAt) throw new ApiError(409, "This person is already in your household.");
  const membership = existing
    ? await db.membership.update({ where: { id: existing.id }, data: { role, inviteHash, createdAt: new Date() } })
    : await db.membership.create({ data: { ownerId: actorId, email, role, inviteHash } });

  const invitee = await db.user.findUnique({ where: { email }, select: { language: true } });
  const lang = invitee?.language === "bn" ? "bn" : "en";
  await sendEmail({ to: email, ...householdInviteEmail(lang, owner.name, role, `${await appUrl()}/invite?token=${token}`) });
  return json({ id: membership.id }, 201);
});
