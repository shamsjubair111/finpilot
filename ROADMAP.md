# Sanchay SaaS roadmap

Status: ✅ done · 🟡 partial · ⬜ not started

## Phase 0–1: Foundation
- ✅ Unit tests for calculations and the SMS parser (`npm test`, Vitest)
- ✅ CI on every push: lint, type check, tests, build (`.github/workflows/ci.yml`)
- 🟡 Money precision: amounts are rounded to cents on input. Full move to integer minor units still to do.
- ✅ Security headers (`next.config.ts`)
- ✅ Rate limiting on login, register, password change, import and export (in-memory; move to Redis for multi-instance hosting)
- ✅ Staging: Neon branch + Vercel Preview, documented in DEPLOY.md; `npm run db:deploy` for migrations
- ✅ Monitoring: `/api/health` for uptime checks; server and browser errors logged to the admin dashboard (30-day retention). Sentry optional later
- ✅ Security activity log (sign-ins, failed attempts, password/2FA changes, exports) shown in Settings; 180-day retention; removed on account deletion
- ⬜ Field encryption for account numbers

## Phase 2: Accounts and trust
- ✅ Data export: transactions as CSV, everything as JSON (Settings → Your data)
- ✅ Account deletion (already existed)
- ✅ Email service (Resend; prints to console when no key is set)
- ✅ Email verification with banner and resend, password reset by email
- ✅ Session revocation: password change/reset and "Sign out other devices" end other sessions
- ✅ Two-step verification (TOTP apps + 10 recovery codes, encrypted secret, replay-safe)
- ✅ Google sign-in (OAuth + PKCE; shown when NEXT_PUBLIC_GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET are set; links accounts by verified email; works with 2FA)

## Phase 3: Launch-ready
- ✅ Public landing page at `/` for signed-out visitors, `/pricing`, `/privacy`, `/terms`
- ✅ Free and Pro plans with limits (`src/lib/plans.ts`), 14-day Pro trial for new and existing users
- ✅ Plan & billing page (`/billing`) with usage meters
- ✅ Online payment via SSLCommerz (bKash, Nagad, cards): checkout, server-side validation, IPN, idempotent crediting, receipt email, payment history. Needs `SSLCOMMERZ_STORE_ID`/`SSLCOMMERZ_STORE_PASSWORD`; falls back to email upgrade
- ✅ Onboarding wizard: income, first account, starter budgets from income; "explore with sample data" option with one-click removal
- ✅ Welcome email (with verification link)
- ✅ Payment receipt email
- ✅ Admin dashboard (`/admin`, access via `ADMIN_EMAILS`): signups, activity, paying users, revenue, churn; search users; give Pro for manual bKash/bank payments, revoke

## Phase 4: Faster data entry
- ✅ Paste-to-import for bKash, Nagad, Rocket and bank SMS (`/import`)
- ✅ Duplicate protection by transaction ID
- ✅ PWA share target: share an SMS to Sanchay on Android to open it in Import
- ✅ Recurring bills and income (`/recurring`): weekly/monthly/quarterly/yearly, mark paid, optional auto-post, due-bill notifications, daily email reminders via `/api/cron/reminders` (`CRON_SECRET`, `vercel.json`)
- ✅ Bank statement CSV import (Import → Bank statement): auto-detects columns, debit/credit or signed amounts, keyword categories, re-upload safe
- ✅ Receipt photos on transactions (compressed in the browser, stored in Postgres, 50 MB per household, image type verified)

## Phases 5–8
- ✅ Offline PWA: service worker (static cache-first, pages + bootstrap network-first), offline page, offline transaction outbox that syncs on reconnect, sync banner
- ✅ Push notifications for bill reminders (VAPID; per-device toggle in Settings; push-service allowlist)
- ✅ Zakat calculator (`/zakat`): prefilled from balances, gold/silver nisab
- ✅ Debt payoff planner (`/debt`): avalanche vs snowball, payoff dates, interest saved
- ✅ Net worth history chart on Accounts (12 months, replayed from transactions)
- ✅ Printable monthly statement and year-in-review (`/reports/statement`), save as PDF via print
- ✅ Spending alerts: unusual expenses and budgets on pace to overspend (insights + bell)
- ✅ Weekly summary email (Mondays, opt-out in Settings) via `/api/cron/weekly-summary`
- ✅ Investment tracking (`/investments`): Sanchayapatra, FDR, DPS, shares, funds, gold, bonds; profit to date, maturity value and dates
- ✅ Streaks card on the dashboard: no-spend days, saving months, under-budget months
- ✅ Shared households (Pro): invite up to 4 people as editor or viewer, switch between households, owner-only money settings, per-household offline outbox (next)
- ✅ Smart categorisation learned from the user's own history (form, SMS and CSV import)
- ✅ AI money assistant (`/assistant`, Pro): Claude Opus 5.5, streamed answers grounded in a snapshot of the user's data, prompt caching, refusal fallbacks; needs `ANTHROPIC_API_KEY`
- ✅ Shared households (Pro): invite up to 4 people as editor or viewer, switch between households, owner-only money settings, per-household offline outbox
- ⬜ Native Android app (only if demand shows)

## Before taking real payments
- Have a lawyer review `/privacy` and `/terms`; they are a starting template.
- Set `NEXT_PUBLIC_SUPPORT_EMAIL` in production.
- Pro prices (৳199/month, ৳1,990/year) are placeholders in `src/lib/plans.ts`.

## SEO
- ✅ robots.txt, sitemap.xml, Open Graph/Twitter card (set `APP_URL` so links are absolute)

## Extras
- ✅ Custom categories per household (Settings → Your categories), used in every category picker; stable colours in charts
- ✅ Pro renewal reminder email 3 days before a trial or paid period ends (once per period)
- ✅ Referral program: both get 30 days of Pro after the friend verifies their email (max 12 rewards a year); share card on Billing
- ✅ Promo codes: % off Pro checkout, limits and expiry, 100% codes grant Pro directly; managed in /admin
- ✅ Bulk select on Transactions: delete or change category for many at once
- ✅ Budget rollover: optional per budget, carries last month's unspent amount (one month)
- ✅ Bill suggestions: detects payments that repeat monthly and offers to add them as bills
- ✅ "Update balance" on accounts (corrects the opening balance; no fake transactions)
- ✅ Real product screenshots on the landing page (`scripts/landing-shots.mjs` regenerates them)
- ✅ Browser smoke test of every page in English, Bangla and mobile (`npm run test:e2e`)

- ✅ Foreign-currency accounts (PayPal, Payoneer, foreign banks): balances in their own currency, user-set exchange rates, converted net worth, foreign amounts on transactions and imports
- ✅ Split transactions: one payment across several categories; budgets, reports, insights, filters and emails count each part

## Ideas not started
- Load transaction history in pages for extremely large accounts (all transactions still load at startup; fine at 5,000)
- Native Android app (only if demand shows)
- ✅ Accessibility: axe-core audit of main pages passes WCAG A/AA in light and dark mode (`npm run test:a11y`, `A11Y_DARK=1` for dark); labelled progress bars and pickers, stronger contrast
- ✅ Performance for big accounts (tested with 5,000 transactions): faster startup query, auto-post in parallel, transactions list draws 100 at a time with Show more, deferred search; Server-Timing header on /api/bootstrap
