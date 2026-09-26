import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { ApiError, handleError, json } from "@/lib/server/api";
import { createSession } from "@/lib/server/session";
import { toProfile } from "@/lib/server/user";
import { registerSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const { name, email, password } = registerSchema.parse(await req.json());
    if (await db.user.findUnique({ where: { email } }))
      throw new ApiError(409, "An account with this email already exists. Try signing in.");
    const user = await db.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
    });
    await createSession(user.id);
    return json(toProfile(user), 201);
  } catch (err) {
    return handleError(err);
  }
}
