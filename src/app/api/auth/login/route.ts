import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { ApiError, handleError, json } from "@/lib/server/api";
import { createSession } from "@/lib/server/session";
import { toProfile } from "@/lib/server/user";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const { email, password } = loginSchema.parse(await req.json());
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      throw new ApiError(401, "Incorrect email or password.");
    await createSession(user.id);
    return json(toProfile(user));
  } catch (err) {
    return handleError(err);
  }
}
