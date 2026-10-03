// Accessibility audit with axe-core: signs up a throwaway user with sample data and checks the main
// pages for WCAG A/AA issues. Usage: npm run dev, then `CHROME_PATH=/usr/bin/google-chrome node scripts/a11y-audit.mjs`.
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const PAGES = ["/", "/accounts", "/transactions", "/budget", "/recurring", "/goals", "/billing", "/settings", "/import"];
const PUBLIC = ["/pricing", "/login", "/register"];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: process.env.A11Y_DARK ? "dark" : "light" });
const page = await ctx.newPage();
const found = new Map();

async function audit(path) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).exclude("nextjs-portal").analyze();
  for (const v of violations) {
    const entry = found.get(v.id) ?? { impact: v.impact, help: v.help, pages: new Set(), samples: new Set() };
    entry.pages.add(path);
    for (const n of v.nodes.slice(0, 3)) entry.samples.add(process.env.A11Y_HTML ? `${n.html.slice(0, 160)} → ${(n.any[0]?.message ?? "").slice(0, 160)}` : n.target.join(" ").slice(0, 120));
    found.set(v.id, entry);
  }
}

for (const p of PUBLIC) await audit(p);
const email = `smoketest-a11y${Date.now()}@example.com`;
await page.request.post(`${BASE}/api/auth/register`, { data: { name: "A11y Tester", email, password: "smoketest123" } });
try {
  await page.request.post(`${BASE}/api/sample-data`);
  await page.request.post(`${BASE}/api/onboarding`, { data: {} });
  for (const p of PAGES) await audit(p);
} finally {
  await page.request.delete(`${BASE}/api/profile`, { data: { password: "smoketest123" } });
  await browser.close();
}

const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
const list = [...found.entries()].sort((a, b) => order[a[1].impact] - order[b[1].impact]);
console.log(`${list.length} distinct accessibility issues`);
for (const [id, e] of list) console.log(`\n[${e.impact}] ${id}: ${e.help}\n  pages: ${[...e.pages].join(", ")}\n  e.g. ${[...e.samples].slice(0, 3).join(" | ")}`);
process.exitCode = list.some(([, e]) => e.impact === "critical" || e.impact === "serious") ? 1 : 0;
