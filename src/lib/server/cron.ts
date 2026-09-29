import "server-only";
import { timingSafeEqual } from "node:crypto";
import { json } from "./api";

/** Returns an error response unless the request carries "Authorization: Bearer <CRON_SECRET>". */
export function cronGuard(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return json({ error: "CRON_SECRET is not configured." }, 503);
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const ok = header.length === expected.length && timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  return ok ? null : json({ error: "Unauthorized" }, 401);
}
