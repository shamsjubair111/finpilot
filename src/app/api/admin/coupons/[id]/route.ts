import { z } from "zod";
import { db } from "@/lib/server/db";
import { json } from "@/lib/server/api";
import { adminOnly } from "@/lib/server/admin";

export const PATCH = adminOnly<{ id: string }>(async ({ req, params }) => {
  const { active } = z.object({ active: z.boolean() }).parse(await req.json());
  return json(await db.coupon.update({ where: { id: params.id }, data: { active } }));
});
