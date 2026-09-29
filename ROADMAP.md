# Sanchay SaaS roadmap

Status: ✅ done · 🟡 partial · ⬜ not started

## Phase 0–1: Foundation
- ✅ Unit tests for calculations and the SMS parser (`npm test`, Vitest)
- ✅ CI on every push: lint, type check, tests, build (`.github/workflows/ci.yml`)
- 🟡 Money precision: amounts are rounded to cents on input. Full move to integer minor units still to do.
- ✅ Security headers (`next.config.ts`)
- ✅ Rate limiting on login, register, password change, import and export (in-memory; move to Redis for multi-instance hosting)
- ⬜ Staging environment with its own database
- ⬜ Sentry error tracking and uptime monitoring
- ⬜ Audit log, field encryption for account numbers

## Phase 2: Accounts and trust
- ✅ Data export: transactions as CSV, everything as JSON (Settings → Your data)
- ✅ Account deletion (already existed)
- ✅ Email service (Resend; prints to console when no key is set)
- ✅ Email verification with banner and resend, password reset by email
- ✅ Session revocation: password change/reset and "Sign out other devices" end other sessions
- ⬜ Google sign-in, optional 2FA

## Phase 3: Launch-ready
- ✅ Public landing page at `/` for signed-out visitors, `/pricing`, `/privacy`, `/terms`
- ✅ Free and Pro plans with limits (`src/lib/plans.ts`), 14-day Pro trial for new and existing users
- ✅ Plan & billing page (`/billing`) with usage meters
- ⬜ Online payment (SSLCommerz first) with webhook; until then the upgrade button emails `NEXT_PUBLIC_SUPPORT_EMAIL`
- ✅ Onboarding wizard: income, first account, starter budgets from income
- ✅ Welcome email (with verification link)
- ⬜ Payment emails
- ✅ Admin dashboard (`/admin`, access via `ADMIN_EMAILS`): signups, activity, paying users, revenue, churn; search users; give Pro for manual bKash/bank payments, revoke

## Phase 4: Faster data entry
- ✅ Paste-to-import for bKash, Nagad, Rocket and bank SMS (`/import`)
- ✅ Duplicate protection by transaction ID
- ✅ PWA share target: share an SMS to Sanchay on Android to open it in Import
- ✅ Recurring bills and income (`/recurring`): weekly/monthly/quarterly/yearly, mark paid, optional auto-post, due-bill notifications, daily email reminders via `/api/cron/reminders` (`CRON_SECRET`, `vercel.json`)
- ✅ Bank statement CSV import (Import → Bank statement): auto-detects columns, debit/credit or signed amounts, keyword categories, re-upload safe
- ⬜ Receipt photos

## Phases 5–8
- ⬜ Full offline PWA and push notifications
- ✅ Zakat calculator (`/zakat`): prefilled from balances, gold/silver nisab
- ✅ Debt payoff planner (`/debt`): avalanche vs snowball, payoff dates, interest saved
- ✅ Net worth history chart on Accounts (12 months, replayed from transactions)
- ✅ Printable monthly statement and year-in-review (`/reports/statement`), save as PDF via print
- ✅ Spending alerts: unusual expenses and budgets on pace to overspend (insights + bell)
- ✅ Weekly summary email (Mondays, opt-out in Settings) via `/api/cron/weekly-summary`
- ✅ Investment tracking (`/investments`): Sanchayapatra, FDR, DPS, shares, funds, gold, bonds; profit to date, maturity value and dates
- ✅ Streaks card on the dashboard: no-spend days, saving months, under-budget months
- ⬜ Household workspaces (next)
- ⬜ Household workspaces, AI categorisation and assistant
- ⬜ Native Android app (only if demand shows)

## Before taking real payments
- Have a lawyer review `/privacy` and `/terms`; they are a starting template.
- Set `NEXT_PUBLIC_SUPPORT_EMAIL` in production.
- Pro prices (৳199/month, ৳1,990/year) are placeholders in `src/lib/plans.ts`.
