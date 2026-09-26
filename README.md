# Sanchay (সঞ্চয়)

Personal finance for Bangladesh and the world — track bank accounts, bKash/Nagad/Rocket wallets,
PayPal/Wise, cash, credit cards and loans; budgets, savings goals, a wishlist with affordability
scoring, a scenario lab, insights and reports. Fully bilingual (English / বাংলা) and multi-currency.

## Stack

- Next.js 16 (App Router) — UI and API route handlers (`src/app/api`)
- PostgreSQL (Neon) via Prisma 7 (`prisma/schema.prisma`)
- Cookie sessions signed with `jose`, passwords hashed with `bcryptjs`

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values
npx prisma migrate deploy
npm run dev
```

`.env` needs:

| Variable       | Purpose                                                     |
| -------------- | ----------------------------------------------------------- |
| `DATABASE_URL` | Pooled Postgres URL used by the app                         |
| `DIRECT_URL`   | Direct (non-pooled) Postgres URL used by Prisma migrations  |
| `AUTH_SECRET`  | Long random string used to sign session cookies             |

## Translations

UI strings are written in English and wrapped in `t()`; Bengali lives in `src/lib/i18n/bn.ts`,
keyed by the English text. Missing keys fall back to English.
