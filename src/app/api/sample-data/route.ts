import { authed, json } from "@/lib/server/api";
import { addSampleData, removeSampleData } from "@/lib/server/sample-data";
import { rateLimit } from "@/lib/server/rate-limit";

// Sample data only ever goes into the signed-in person's own finances.
export const POST = authed(async ({ actorId }) => {
  await rateLimit("sample-data", 10, 60 * 60 * 1000, actorId);
  return json({ added: await addSampleData(actorId) });
});

export const DELETE = authed(async ({ actorId }) => {
  await removeSampleData(actorId);
  return json({ ok: true });
});
