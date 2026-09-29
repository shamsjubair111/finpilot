import "server-only";
import { headers } from "next/headers";
import { ApiError } from "./api";

// Fixed-window limiter kept in process memory. It protects a single server instance;
// move the buckets to Redis (e.g. Upstash) once the app runs on several instances.
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

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

export async function rateLimit(scope: string, limit: number, windowMs: number, id?: string) {
  const key = `${scope}:${id ?? (await clientIp())}`;
  if (!hit(key, limit, windowMs)) throw new ApiError(429, "Too many attempts. Please wait a few minutes and try again.");
}
