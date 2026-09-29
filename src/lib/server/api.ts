import "server-only";
import { ZodError } from "zod";
import { db } from "./db";
import { destroySession, getSession } from "./session";
import { recordError } from "./errors";
import { cookies, headers } from "next/headers";
import { isLang, LANG_COOKIE, translate, type Lang } from "@/lib/i18n";

async function requestLang(): Promise<Lang> {
  try {
    const v = (await cookies()).get(LANG_COOKIE)?.value;
    if (isLang(v)) return v;
    const accept = (await headers()).get("accept-language") ?? "";
    return /^bn\b|,\s*bn\b/i.test(accept) ? "bn" : "en";
  } catch {
    return "en";
  }
}

async function requestPath() {
  try {
    const h = await headers();
    return h.get("x-invoke-path") ?? h.get("referer") ?? null;
  } catch {
    return null;
  }
}

function tr(lang: Lang, msg: string) {
  const nums = msg.match(/\d+/g) ?? [];
  const key = msg.replace(/\d+/g, "{n}");
  const out = translate(lang, key, nums[0] ? { n: Number(nums[0]) } : undefined);
  return out === key ? msg : out;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function handleError(err: unknown) {
  const lang = await requestLang();
  if (err instanceof ApiError) return json({ error: tr(lang, err.message) }, err.status);
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue?.path.join(".");
    const message = tr(lang, issue?.message ?? "Invalid input");
    const label = translate(lang, `field.${field}`);
    return json({ error: field ? `${label.startsWith("field.") ? field : label}: ${message}` : message }, 400);
  }
  if (typeof err === "object" && err && "code" in err && err.code === "P2002")
    return json({ error: tr(lang, "An entry with these details already exists.") }, 409);
  if (typeof err === "object" && err && "code" in err && ["ETIMEDOUT", "P1001", "P1002", "ECONNREFUSED"].includes(String(err.code)))
    return json({ error: tr(lang, "The database is waking up or unreachable. Please try again in a moment.") }, 503);
  if (err instanceof SyntaxError) return json({ error: tr(lang, "Malformed request body") }, 400);
  console.error(err);
  await recordError("server", err, { path: await requestPath() });
  return json({ error: tr(lang, "Something went wrong on our side. Please try again.") }, 500);
}

export async function requireUserId() {
  const session = await getSession();
  if (!session) throw new ApiError(401, "Your session has expired. Please sign in again.");
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { sessionVersion: true } });
  // Clear the cookie on rejection; otherwise the proxy would still treat this browser as signed in.
  if (!user) {
    await destroySession();
    throw new ApiError(401, "Your account no longer exists. Please sign in again.");
  }
  if (user.sessionVersion !== session.version) {
    await destroySession();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }
  return session.userId;
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
