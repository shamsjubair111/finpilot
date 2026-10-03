import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, authed, json, resolveLedger } from "@/lib/server/api";
import { destroySession, setLangCookie } from "@/lib/server/session";
import { toProfile } from "@/lib/server/user";
import { profileSchema } from "@/lib/validation";

const HOUSEHOLD_FIELDS = ["currency", "monthlySalary", "currentSavings", "emergencyFundTarget", "emergencyFundCurrent", "defaultSavingsTarget", "exchangeRates"] as const;

export const PATCH = authed(async ({ userId, req }) => {
  const data = profileSchema.parse(await req.json());
  // In someone else's household these settings belong to the owner.
  if (HOUSEHOLD_FIELDS.some((k) => k in data) && (await resolveLedger(userId)).ownerId !== userId)
    throw new ApiError(403, "Only the household owner can change these settings.");
  const user = await db.user.update({ where: { id: userId }, data });
  if (data.language) await setLangCookie(data.language);
  return json(toProfile(user));
});

export const DELETE = authed(async ({ userId, req }) => {
  const { password } = z.object({ password: z.string().min(1, "is required") }).parse(await req.json());
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.passwordSet) throw new ApiError(400, "You signed up with Google. Use \"Forgot password\" to set a password first.");
  if (!(await bcrypt.compare(password, user.passwordHash)))
    throw new ApiError(403, "Password is incorrect. Your account was not deleted.");
  await db.$transaction([db.user.delete({ where: { id: userId } }), db.auditEvent.deleteMany({ where: { userId } })]);
  await destroySession();
  return json({ ok: true });
});
