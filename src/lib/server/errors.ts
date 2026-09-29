import "server-only";
import { db } from "./db";

let recent = 0;
let windowStart = Date.now();

/** Stores an unexpected error for the admin dashboard. Throttled so an error storm can't flood the table. */
export async function recordError(source: "server" | "client", err: unknown, extra: { path?: string | null; userId?: string | null } = {}) {
  const now = Date.now();
  if (now - windowStart > 60_000) {
    windowStart = now;
    recent = 0;
  }
  if (++recent > 30) return;
  const e = err instanceof Error ? err : new Error(typeof err === "string" ? err : JSON.stringify(err));
  try {
    await db.errorEvent.create({
      data: {
        source,
        message: e.message.slice(0, 500) || "(no message)",
        stack: e.stack?.slice(0, 4000) ?? null,
        path: extra.path?.slice(0, 300) ?? null,
        userId: extra.userId ?? null,
      },
    });
  } catch (dbErr) {
    console.error("[recordError]", dbErr);
  }
}
