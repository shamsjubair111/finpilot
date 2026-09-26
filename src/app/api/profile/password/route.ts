import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { passwordSchema } from "@/lib/validation";

export const PATCH = authed(async ({ userId, req }) => {
  const { currentPassword, newPassword } = passwordSchema.parse(await req.json());
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
    throw new ApiError(403, "Current password is incorrect.");
  await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  return json({ ok: true });
});
