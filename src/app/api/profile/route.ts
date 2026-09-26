import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { destroySession, setLangCookie } from "@/lib/server/session";
import { toProfile } from "@/lib/server/user";
import { profileSchema } from "@/lib/validation";

export const PATCH = authed(async ({ userId, req }) => {
  const data = profileSchema.parse(await req.json());
  const user = await db.user.update({ where: { id: userId }, data });
  if (data.language) await setLangCookie(data.language);
  return json(toProfile(user));
});

export const DELETE = authed(async ({ userId, req }) => {
  const { password } = z.object({ password: z.string().min(1, "is required") }).parse(await req.json());
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await bcrypt.compare(password, user.passwordHash)))
    throw new ApiError(403, "Password is incorrect. Your account was not deleted.");
  await db.user.delete({ where: { id: userId } });
  await destroySession();
  return json({ ok: true });
});
