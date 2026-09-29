import { z } from "zod";
import { db } from "@/lib/server/db";
import { json } from "@/lib/server/api";
import { adminOnly } from "@/lib/server/admin";
import { normaliseCode } from "@/lib/server/coupons";

const schema = z.object({
  code: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_-]+$/, "use letters, numbers, - or _").transform(normaliseCode),
  percentOff: z.coerce.number().int().min(1).max(100),
  maxUses: z.coerce.number().int().min(1).max(100000).optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const GET = adminOnly(async () => json(await db.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 100 })));

export const POST = adminOnly(async ({ req }) => json(await db.coupon.create({ data: schema.parse(await req.json()) }), 201));
