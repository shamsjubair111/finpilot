# Sanchay (সঞ্চয়)

Personal finance for Bangladesh and the world, sold as a SaaS with Free and Pro plans. Fully bilingual
(English / বাংলা) and multi-currency.

**What people can do**

- Track bank accounts, bKash/Nagad/Rocket wallets, cash, cards, loans and foreign-currency accounts (PayPal, Payoneer)
- Import transactions by pasting bKash, Nagad, Rocket or bank SMS, or uploading a bank statement CSV
- Budgets (with rollover), split transactions, custom categories, receipt photos, bulk edit
- Bills and regular income with reminders, auto-posting, and a 30-day cash-flow forecast
- Goals (optionally tied to an account), wishlist with affordability checks, scenario lab, debt payoff planner,
  investments (Sanchayapatra, FDR, DPS, shares, gold), zakat calculator, net worth history
- Insights, spending alerts, streaks, monthly statements and year in review (print to PDF), weekly summary email
- An AI money assistant (Pro) grounded in the user's own data
- Shared households (Pro) with editor or viewer access
- Works offline as an installable app, with push notifications for bills

**Running it as a business**: online payments via SSLCommerz, promo codes, referrals, renewal reminders,
an admin dashboard (users, revenue, manual Pro grants, support inbox, error log), Help page, and security
features (email verification, password reset, Google sign-in, two-step verification, activity log).

See [ROADMAP.md](ROADMAP.md) for the full feature list and what's next.

## Stack

- Next.js 16 (App Router): UI and API route handlers (`src/app/api`)
- PostgreSQL (Neon) via Prisma 7 (`prisma/schema.prisma`)
- Cookie sessions signed with `jose`, passwords hashed with `bcryptjs`
- Resend for email, SSLCommerz for payments, Web Push, Claude for the AI assistant (all optional)

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values
npm run db:deploy      # apply database migrations
npm run dev
```

The minimum `.env` needs:

| Variable       | Purpose                                                     |
| -------------- | ----------------------------------------------------------- |
| `DATABASE_URL` | Pooled Postgres URL used by the app                         |
| `DIRECT_URL`   | Direct (non-pooled) Postgres URL used by Prisma migrations  |
| `AUTH_SECRET`  | Long random string used to sign session cookies             |

Everything else (email, payments, Google sign-in, push, AI, admin access, cron) is optional and
documented in [DEPLOY.md](DEPLOY.md), which also covers going live on Vercel with a staging database.

## Checks

| Command | What it does |
| --- | --- |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm test` | Unit tests (Vitest) for calculations, parsers, currency, splits, security helpers |
| `npm run test:e2e` | Opens every page in a real browser (English, Bangla, mobile) and reports errors |
| `npm run test:flows` | Clicks through everyday tasks: accounts, transactions, splits, goals, budgets, bills, bulk edit |
| `npm run test:a11y` | Accessibility audit (WCAG A/AA) with axe-core; `A11Y_DARK=1` for dark mode |

The browser checks need `npm run dev` running. If Playwright's own browser isn't installed, point
`CHROME_PATH` at Chrome (for example `CHROME_PATH=/usr/bin/google-chrome`). They create a throwaway
`smoketest-…@example.com` user and delete it afterwards.

CI (`.github/workflows/ci.yml`) runs lint, type check, unit tests and a production build on every push.

## Translations

UI strings are written in English and wrapped in `t()`; Bengali lives in `src/lib/i18n/bn.ts`, keyed by
the English text. Missing keys fall back to English. To add strings:

```bash
python3 scripts/add-bn.py "Section name" <<'EOF'
{"English text": "বাংলা অনুবাদ"}
EOF
```
