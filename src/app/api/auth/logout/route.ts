import { json } from "@/lib/server/api";
import { destroySession } from "@/lib/server/session";

export async function POST() {
  await destroySession();
  return json({ ok: true });
}
