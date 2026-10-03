// Smoke test: signs up a throwaway user, loads sample data, then opens every page (English, Bangla,
// mobile) in a real browser and reports crashes, console errors and failed API calls.
// Usage: npm run dev, then `npm run test:e2e` (CHROME_PATH=/usr/bin/google-chrome if Playwright's
// own browser isn't installed; E2E_BASE_URL to target another server).
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const email = `smoketest-e2e${Date.now()}@example.com`;
const PAGES = ["/", "/accounts", "/transactions", "/import", "/import?tab=csv", "/budget", "/recurring", "/investments", "/goals", "/wishlist",
  "/scenario-lab", "/timeline", "/debt", "/zakat", "/assistant", "/insights", "/reports", "/reports/statement", "/reports/statement?period=year",
  "/billing", "/settings", "/help", "/invite?token=abc"];
const PUBLIC = ["/pricing", "/privacy", "/terms", "/login", "/register", "/forgot-password", "/reset-password?token=x"];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true });
const results = [];
async function visit(page, path, lang) {
  const errors = [];
  const onConsole = (m) => m.type() === "error" && !/favicon|Failed to load resource: the server responded with a status of (401|404)/.test(m.text()) && errors.push(`console: ${m.text().slice(0, 200)}`);
  const onPageError = (e) => errors.push(`pageerror: ${e.message.slice(0, 200)}`);
  const onResponse = (r) => r.url().includes("/api/") && r.status() >= 500 && errors.push(`api ${r.status()}: ${r.url().replace(BASE, "")}`);
  page.on("console", onConsole); page.on("pageerror", onPageError); page.on("response", onResponse);
  await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 }).catch((e) => errors.push(`nav: ${e.message.slice(0, 120)}`));
  await page.waitForTimeout(800);
  const crashed = await page.getByText(/Something went wrong|কিছু একটা ভুল হয়েছে/).count().catch(() => 0);
  if (crashed) errors.push("error boundary shown");
  page.off("console", onConsole); page.off("pageerror", onPageError); page.off("response", onResponse);
  results.push({ path, lang, errors });
}

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
for (const p of PUBLIC) await visit(page, p, "public");

// Sign up through the API, then onboard with sample data so pages have content.
const reg = await page.request.post(`${BASE}/api/auth/register`, { data: { name: "E2E Tester", email, password: "smoketest123" } });
if (!reg.ok()) throw new Error("register failed " + reg.status());
await page.request.post(`${BASE}/api/sample-data`);
await page.request.post(`${BASE}/api/onboarding`, { data: {} });
await visit(page, "/onboarding", "en");
for (const p of PAGES) await visit(page, p, "en");


// Same pages in Bangla.
await page.request.patch(`${BASE}/api/profile`, { data: { language: "bn" } });
await ctx.addCookies([{ name: "lang", value: "bn", url: BASE }]);
for (const p of PAGES) await visit(page, p, "bn");
await page.goto(BASE + "/", { waitUntil: "networkidle" });

// Mobile layout of a few key pages.
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: await ctx.storageState() });
const m = await mctx.newPage();
for (const p of ["/", "/transactions", "/budget", "/settings"]) await visit(m, p, "mobile");
await m.goto(BASE + "/", { waitUntil: "networkidle" });

await page.request.delete(`${BASE}/api/profile`, { data: { password: "smoketest123" } });
await browser.close();

const bad = results.filter((r) => r.errors.length);
console.log(`visited ${results.length} pages, ${bad.length} with problems`);
process.exitCode = bad.length ? 1 : 0;
for (const r of bad) console.log(`\n[${r.lang}] ${r.path}\n  - ${[...new Set(r.errors)].join("\n  - ")}`);
