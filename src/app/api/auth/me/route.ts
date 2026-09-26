import { db } from "@/lib/server/db";
import { authed, json } from "@/lib/server/api";
import { toProfile } from "@/lib/server/user";

export const GET = authed(async ({ userId }) =>
  json(toProfile(await db.user.findUniqueOrThrow({ where: { id: userId } })))
);
