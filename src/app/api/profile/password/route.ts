import bcrypt from "bcryptjs";
import { audit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { passwordSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/server/rate-limit";
import { revokeSessions } from "@/lib/server/session";

export const PATCH = authed(async ({ userId, req }) => {
  await rateLimit("password", 5, 15 * 60 * 1000, userId);
  const { currentPassword, newPassword } = passwordSchema.parse(await req.json());
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.passwordSet) throw new ApiError(400, "You signed up with Google. Use \"Forgot password\" to set a password first.");
  if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
    throw new ApiError(403, "Current password is incorrect.");
  await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  await revokeSessions(userId, true);
  await audit(userId, "password_changed");
  return json({ ok: true });
});
