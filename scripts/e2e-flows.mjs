// Interactive smoke test: drives the real UI through common tasks (accounts, transactions, splits,
// balance updates, budgets, bills, categories, bulk delete) and checks the results on screen.
// Usage: npm run dev, then `npm run test:flows` (CHROME_PATH=/usr/bin/google-chrome if Playwright's own
// browser isn't installed; E2E_BASE_URL to target another server).
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(30_000);
const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("response", (r) => r.url().includes("/api/") && r.status() >= 500 && problems.push(`api ${r.status()} ${r.url().replace(BASE, "")}`));

const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push(`✓ ${name}`);
  } catch (err) {
    results.push(`✗ ${name}: ${err.message.split("\n")[0].slice(0, 200)}`);
    await page.screenshot({ path: `flow-failure-${results.length}.png` }).catch(() => {});
  }
}
const dialog = () => page.getByRole("dialog");
async function pick(trigger, option) {
  await trigger.click();
  await page.getByRole("option", { name: option, exact: true }).click();
}
async function open(path) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.locator("main h1").first().waitFor();
}
const expectText = async (text) => page.getByText(text, { exact: false }).first().waitFor({ timeout: 15_000 });
const toastGone = () => page.waitForTimeout(400);

const email = `smoketest-flow${Date.now()}@example.com`;
const reg = await page.request.post(`${BASE}/api/auth/register`, { data: { name: "Flow Tester", email, password: "smoketest123" } });
if (!reg.ok()) throw new Error(`register failed: ${reg.status()}`);
await page.request.post(`${BASE}/api/onboarding`, { data: { profile: { monthlySalary: 50000 } } });

try {
  await step("add a bank account", async () => {
    await open("/accounts");
    await page.getByRole("button", { name: "Add Account" }).first().click();
    await dialog().locator("#acc-name").fill("Flow Bank");
    await dialog().locator("#acc-open").fill("10000");
    await dialog().getByRole("button", { name: "Add account" }).click();
    await dialog().waitFor({ state: "detached" });
    await expectText("Flow Bank");
    await expectText("৳10,000");
  });

  await step("add an expense through the form", async () => {
    await open("/transactions");
    await page.getByRole("button", { name: "Add Transaction" }).first().click();
    await dialog().locator("#txn-title").fill("Lunch at Star");
    await dialog().locator("#txn-amount").fill("650");
    await pick(dialog().locator("#txn-category"), "Food");
    await dialog().getByRole("button", { name: /^Add Expense$/ }).click();
    await dialog().waitFor({ state: "detached" });
    await expectText("Lunch at Star");
  });

  await step("split a transaction across categories", async () => {
    await page.getByRole("button", { name: "Add Transaction" }).first().click();
    await dialog().locator("#txn-title").fill("Shwapno run");
    await dialog().locator("#txn-amount").fill("5000");
    await pick(dialog().locator("#txn-category"), "Food");
    await dialog().getByRole("button", { name: "Split across categories" }).click();
    const amounts = dialog().getByRole("spinbutton", { name: "Amount", exact: true });
    await amounts.nth(0).fill("3500");
    await pick(dialog().getByRole("combobox", { name: "Category" }).nth(1), "Shopping");
    await amounts.nth(1).fill("1500");
    await dialog().getByText("Adds up").waitFor();
    await dialog().getByRole("button", { name: /^Add Expense$/ }).click();
    await dialog().waitFor({ state: "detached" });
    await expectText("Shwapno run");
    await expectText("Food +1");
  });

  await step("update an account balance", async () => {
    await open("/accounts");
    await page.getByRole("button", { name: "Actions for Flow Bank" }).click();
    await page.getByRole("menuitem", { name: "Update balance" }).click();
    await dialog().locator("#adj-balance").fill("9000");
    await dialog().getByRole("button", { name: "Save" }).click();
    await dialog().waitFor({ state: "detached" });
    await expectText("৳9,000");
  });

  await step("link a goal to an account", async () => {
    await open("/goals");
    await page.getByRole("button", { name: "Add Goal" }).first().click();
    await dialog().locator("#goal-name").fill("Rainy day");
    await dialog().locator("#goal-amount").fill("50000");
    await dialog().locator("#goal-date").fill("2027-12-31");
    await pick(dialog().locator("#goal-account"), "Flow Bank");
    await dialog().getByText("Follows the balance: ৳9,000").waitFor();
    await dialog().getByRole("button", { name: "Create Goal" }).click();
    await dialog().waitFor({ state: "detached" });
    await expectText("Rainy day");
    await expectText("৳9,000");
  });

  await step("create a budget and see spending against it", async () => {
    await open("/budget");
    await page.getByRole("button", { name: /Add Budget|Create your first budget/ }).first().click();
    await pick(dialog().locator("#budget-category"), "Food");
    await dialog().locator("#budget-amount").fill("8000");
    await dialog().getByRole("button", { name: "Create budget" }).click();
    await dialog().waitFor({ state: "detached" });
    await expectText("of ৳8,000");
    // Lunch (650) + the Food part of the split (3,500).
    await expectText("৳4,150");
  });

  await step("add a bill and mark it paid", async () => {
    await open("/recurring");
    await page.getByRole("button", { name: /^Add$/ }).first().click();
    await dialog().locator("#cm-title").fill("Internet");
    await dialog().locator("#cm-amount").fill("1200");
    await dialog().locator("#cm-date").fill(new Date().toISOString().slice(0, 10));
    await dialog().getByRole("button", { name: "Add commitment" }).click();
    await dialog().waitFor({ state: "detached" });
    await expectText("Internet");
    await page.getByRole("button", { name: "Paid", exact: true }).first().click();
    await expectText("Marked as paid");
  });

  await step("add a custom category and use it", async () => {
    await open("/settings");
    await page.getByRole("textbox", { name: "Category name" }).fill("Kids");
    await page.locator("form").filter({ has: page.getByRole("textbox", { name: "Category name" }) }).getByRole("button", { name: "Add" }).click();
    await expectText("Category added");
    await open("/transactions");
    await page.getByRole("button", { name: "Add Transaction" }).first().click();
    await dialog().locator("#txn-category").click();
    await page.getByRole("option", { name: "Kids", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
  });

  await step("lend money, record a part repayment, then settle", async () => {
    await open("/lending");
    await page.getByRole("button", { name: "Add a loan" }).first().click();
    await dialog().getByRole("textbox", { name: "Lent to" }).fill("Karim");
    await dialog().getByRole("spinbutton", { name: "Amount" }).fill("3000");
    await dialog().getByRole("button", { name: "Save" }).click();
    await page.getByText("Karim").waitFor();
    await page.getByRole("button", { name: "Record repayment" }).click();
    await dialog().getByRole("spinbutton", { name: "Amount repaid" }).fill("1000");
    await dialog().getByRole("button", { name: "Save" }).click();
    await expectText("1,000 of");
    await page.getByRole("button", { name: "Record repayment" }).click();
    await dialog().getByRole("button", { name: "Save" }).click();
    await expectText("Everything is settled.");
    await page.getByRole("tab", { name: "Settled" }).click();
    await page.getByText("Karim").waitFor();
  });

  await step("bulk delete transactions", async () => {
    await open("/transactions");
    const before = await page.locator("tbody tr").count();
    await page.getByRole("checkbox", { name: "Select Lunch at Star" }).first().check();
    await page.getByRole("checkbox", { name: "Select Shwapno run" }).first().check();
    await expectText("2 selected");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await dialog().getByRole("button", { name: /Delete/ }).last().click();
    await expectText("Deleted 2 transactions");
    await page.waitForFunction((n) => document.querySelectorAll("tbody tr").length === n - 2, before);
  });

  await toastGone();
} finally {
  await page.request.delete(`${BASE}/api/profile`, { data: { password: "smoketest123" } }).catch(() => {});
  await browser.close();
}

console.log(results.join("\n"));
if (problems.length) console.log("\nproblems:\n  " + [...new Set(problems)].join("\n  "));
process.exitCode = results.some((r) => r.startsWith("✗")) || problems.length ? 1 : 0;
