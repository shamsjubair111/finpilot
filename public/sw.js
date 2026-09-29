// Sanchay service worker: makes the installed app open without a connection.
// - Static build assets: cache first (their URLs are content-hashed).
// - Pages and /api/bootstrap: network first, falling back to the last copy.
// - Every other API call goes straight to the network and is never cached.
const VERSION = "v1";
const STATIC = `static-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll([OFFLINE_URL, "/icon.svg"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC, PAGES].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The app asks us to forget cached pages and data on sign-out.
self.addEventListener("message", (event) => {
  if (event.data === "clear") event.waitUntil(caches.delete(PAGES).then(() => caches.open(PAGES)).then((c) => c.add(OFFLINE_URL)));
});

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") return (await cache.match("/")) || (await cache.match(OFFLINE_URL));
    return new Response(JSON.stringify({ error: "You're offline." }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/static/") || /\.(?:svg|png|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname === "/api/bootstrap" || (request.mode === "navigate" && !url.pathname.startsWith("/api/"))) {
    event.respondWith(networkFirst(request));
  }
});
