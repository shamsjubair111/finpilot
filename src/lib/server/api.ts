import "server-only";
import { ZodError } from "zod";
import { db } from "./db";
import { getSessionUserId } from "./session";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function handleError(err: unknown) {
  if (err instanceof ApiError) return json({ error: err.message }, err.status);
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue?.path.join(".");
    return json({ error: field ? `${field}: ${issue.message}` : issue?.message ?? "Invalid input" }, 400);
  }
  if (typeof err === "object" && err && "code" in err && err.code === "P2002")
    return json({ error: "An entry with these details already exists." }, 409);
  if (typeof err === "object" && err && "code" in err && ["ETIMEDOUT", "P1001", "P1002", "ECONNREFUSED"].includes(String(err.code)))
    return json({ error: "The database is waking up or unreachable. Please try again in a moment." }, 503);
  if (err instanceof SyntaxError) return json({ error: "Malformed request body" }, 400);
  console.error(err);
  return json({ error: "Something went wrong on our side. Please try again." }, 500);
}

export async function requireUserId() {
  const userId = await getSessionUserId();
  if (!userId) throw new ApiError(401, "Your session has expired. Please sign in again.");
  const exists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!exists) throw new ApiError(401, "Your account no longer exists. Please sign in again.");
  return userId;
}

type Ctx<P> = { params: Promise<P> };

export function authed<P = Record<string, never>>(
  fn: (args: { userId: string; req: Request; params: P }) => Promise<Response>
) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      const userId = await requireUserId();
      return await fn({ userId, req, params: await ctx.params });
    } catch (err) {
      return handleError(err);
    }
  };
}
