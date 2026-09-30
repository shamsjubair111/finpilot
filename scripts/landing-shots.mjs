// Regenerates the product screenshots on the landing page (public/landing) from the real app with
// sample data. Usage: npm run dev, then `CHROME_PATH=/usr/bin/google-chrome node scripts/landing-shots.mjs`.
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const OUT = new URL("../public/landing/", import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
const page = await ctx.newPage();
const email = `rahim.uddin.${Date.now()}@example.com`;
await page.request.post(`${BASE}/api/auth/register`, { data: { name: "Rahim Uddin", email, password: "smoketest123" } });
try {
  await page.request.post(`${BASE}/api/sample-data`);
  await page.request.post(`${BASE}/api/onboarding`, { data: { profile: { monthlySalary: 65000, currentSavings: 120000, emergencyFundTarget: 390000 } } });
  // Hide notices and the dev-mode badge; everything else is the real UI.
  const css = `main .print\\:hidden { display: none !important } nextjs-portal { display: none !important }`;
  const shot = async (path, file) => {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: css });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: OUT + file, type: "jpeg", quality: 82 });
  };
  await shot("/", "dashboard.jpg");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.request.patch(`${BASE}/api/profile`, { data: { language: "bn" } });
  await ctx.addCookies([{ name: "lang", value: "bn", url: BASE }]);
  await shot("/", "mobile-bn.jpg");
} finally {
  await page.request.delete(`${BASE}/api/profile`, { data: { password: "smoketest123" } });
  await browser.close();
}
console.log("screenshots written to public/landing");
