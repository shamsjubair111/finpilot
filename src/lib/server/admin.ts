import "server-only";
import { ApiError, authed } from "./api";
import { db } from "./db";

/** Admins are listed in ADMIN_EMAILS (comma-separated), so access can't be granted through the app itself. */
export function isAdminEmail(email: string) {
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

type Handler<P> = Parameters<typeof authed<P>>[0];

export function adminOnly<P = Record<string, never>>(fn: (args: Parameters<Handler<P>>[0] & { adminEmail: string }) => Promise<Response>) {
  return authed<P>(async (args) => {
    const me = await db.user.findUniqueOrThrow({ where: { id: args.userId }, select: { email: true } });
    // 404 rather than 403 so the admin area isn't advertised to other users.
    if (!isAdminEmail(me.email)) throw new ApiError(404, "Not found.");
    return fn({ ...args, adminEmail: me.email });
  });
}
