"use client";

import { useEffect } from "react";

/** Registers /sw.js in production builds (a service worker caching dev assets gets in the way while developing). */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}

/** Tells the service worker to drop cached pages and data, e.g. on sign-out. */
export function clearOfflineCache() {
  navigator.serviceWorker?.controller?.postMessage("clear");
}
