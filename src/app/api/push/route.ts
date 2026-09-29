import { z } from "zod";
import { db } from "@/lib/server/db";
import { ApiError, authed, json } from "@/lib/server/api";
import { pushConfigured, sendPush } from "@/lib/server/push";
import { translate } from "@/lib/i18n";

// Only real browser push services, so the server can't be pointed at arbitrary (e.g. internal) URLs.
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/, /(^|\.)push\.apple\.com$/];
const isPushService = (u: string) => {
  const url = new URL(u);
  return url.protocol === "https:" && PUSH_HOSTS.some((re) => re.test(url.hostname));
};

const subscription = z.object({
  endpoint: z.url().max(1000).refine(isPushService, "must be a browser push service"),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

// Save this device's subscription (re-subscribing moves the endpoint to the current user).
export const POST = authed(async ({ userId, req }) => {
  if (!pushConfigured()) throw new ApiError(503, "Push notifications aren't set up on this server.");
  const { endpoint, keys } = subscription.parse(await req.json());
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId, p256dh: keys.p256dh, auth: keys.auth },
  });
  const { language } = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { language: true } });
  const lang = language === "bn" ? "bn" : "en";
  const sent = await sendPush(userId, { title: translate(lang, "Sanchay"), body: translate(lang, "Notifications are on for this device."), url: "/recurring" });
  return json({ ok: true, sent });
});

export const DELETE = authed(async ({ userId, req }) => {
  const { endpoint } = z.object({ endpoint: z.string().max(1000) }).parse(await req.json());
  await db.pushSubscription.deleteMany({ where: { userId, endpoint } });
  return json({ ok: true });
});
