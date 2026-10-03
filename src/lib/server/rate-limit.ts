import "server-only";
import { headers } from "next/headers";
import { ApiError } from "./api";

// Fixed-window rate limiting. With UPSTASH_REDIS_REST_URL/TOKEN set, counts are shared by every server
// instance (needed on Vercel, where each request may hit a different instance). Without them, or if
// Redis can't be reached, counts are kept in this process's memory.
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** In-memory counter; returns true while the key is within its limit. */
export function hit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** Shared counter in Upstash Redis (REST API); null when not configured or unreachable. */
async function hitRedis(key: string, limit: number, windowMs: number): Promise<boolean | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      // INCR then start the window on the first hit only (NX), so the window doesn't slide.
      body: JSON.stringify([
        ["INCR", `rl:${key}`],
        ["PEXPIRE", `rl:${key}`, String(windowMs), "NX"],
      ]),
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const [incr] = (await res.json()) as { result?: number; error?: string }[];
    return typeof incr?.result === "number" ? incr.result <= limit : null;
  } catch {
    return null;
  }
}

export async function rateLimit(scope: string, limit: number, windowMs: number, id?: string) {
  const key = `${scope}:${id ?? (await clientIp())}`;
  const allowed = (await hitRedis(key, limit, windowMs)) ?? hit(key, limit, windowMs);
  if (!allowed) throw new ApiError(429, "Too many attempts. Please wait a few minutes and try again.");
}
