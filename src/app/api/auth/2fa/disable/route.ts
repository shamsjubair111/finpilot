import bcrypt from "bcryptjs";
import { audit } from "@/lib/server/audit";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";

const schema = z.object({ password: z.string().min(1, "is required") });

export const POST = authed(async ({ userId, req }) => {
  await rateLimit("2fa-disable", 5, 15 * 60 * 1000, userId);
  const { password } = schema.parse(await req.json());
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true, passwordSet: true } });
  if (!user.passwordSet) throw new ApiError(400, "You signed up with Google. Use \"Forgot password\" to set a password first.");
  if (!(await bcrypt.compare(password, user.passwordHash))) throw new ApiError(403, "Password is incorrect.");
  await db.user.update({ where: { id: userId }, data: { totpSecret: null, totpEnabledAt: null, totpLastStep: null, recoveryCodes: [] } });
  await audit(userId, "2fa_disabled");
  return json({ ok: true });
});
