# Deploying Sanchay

This guide takes Sanchay from this repository to a live SaaS on Vercel with Neon Postgres, plus a staging copy for testing changes safely.

## 1. Databases: production and staging

Use one Neon project with two branches:

| Branch | Used by | Notes |
| --- | --- | --- |
| `main` | Production | Real users' data |
| `staging` | Preview deployments | Create it from `main` in the Neon console; reset it from `main` whenever you want fresh copies of real schema |

Each branch has its own pooled URL (`DATABASE_URL`) and direct URL (`DIRECT_URL`).

Apply migrations before each release. Run it against staging first, then production:

```bash
DIRECT_URL="<branch direct url>" npm run db:deploy
```

All migrations so far are additive (new tables/columns only), so they are safe to run on a live database.

## 2. Vercel project

1. Import the repository in Vercel. The framework preset (Next.js) and `npm run build` are correct as-is.
2. Add a custom domain (for example `sanchay.app`) and set `APP_URL` to it.
3. Set the environment variables below. Use **Production** values for the production environment, and the staging database plus test keys for **Preview**.
4. `vercel.json` already schedules the two cron jobs. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically once `CRON_SECRET` is set.

## 3. Environment variables

| Variable | Required | What it's for |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled Neon URL used by the app |
| `DIRECT_URL` | Yes | Direct Neon URL used for migrations |
| `AUTH_SECRET` | Yes | Signs sessions and encrypts 2FA secrets. Generate with `openssl rand -base64 48`. **Changing it signs everyone out and breaks existing 2FA setups.** |
| `APP_URL` | Yes | Public URL, e.g. `https://sanchay.app`. Used in emails, payment callbacks, Google sign-in and social cards |
| `CRON_SECRET` | Yes | Protects `/api/cron/*` |
| `ADMIN_EMAILS` | Yes | Comma-separated emails that can open `/admin` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Recommended | Shown on legal pages and as the upgrade contact |
| `RESEND_API_KEY`, `EMAIL_FROM` | Recommended | Sends verification, reset, reminder, summary and receipt emails. Verify your domain in Resend first. Without a key, emails only print to the server log |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD` | For payments | From your SSLCommerz merchant panel. Keep `SSLCOMMERZ_LIVE="false"` on Preview (sandbox) and set `"true"` on Production |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional | Google sign-in. Redirect URI: `<APP_URL>/api/auth/google/callback` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Optional | Push notifications. Generate once with `npx web-push generate-vapid-keys`; keep them stable or existing subscriptions stop working |
| `ANTHROPIC_API_KEY` | Optional | The AI money assistant (Pro). Each message is a paid API call |

`NEXT_PUBLIC_*` values are built into the browser bundle, so redeploy after changing them.

## 4. Third-party setup checklist

- **SSLCommerz:** register the store with your domain. The app sends success, fail, cancel and IPN URLs with each checkout, so nothing else needs configuring in the panel. Test one sandbox payment on staging before going live.
- **Resend:** add the DNS records it gives you (SPF, DKIM), then set `EMAIL_FROM` to an address on that domain.
- **Google Cloud:** create an OAuth client of type *Web application*, add the redirect URI above, and publish the consent screen.
- **Uptime monitor:** point any monitor (Better Stack, UptimeRobot…) at `<APP_URL>/api/health`. It returns 200 when the app and database respond.

## 5. Release routine

1. Push to a branch: Vercel builds a Preview deployment against the staging database.
2. Run `npm run db:deploy` against staging if the change includes a migration, then click through the preview.
3. Merge to `main`: run `npm run db:deploy` against production, then let Vercel deploy.
4. Watch `/admin` → Errors for the first hour.

## 6. Before taking real payments

- Have a lawyer review `/privacy` and `/terms`.
- Confirm Pro prices in `src/lib/plans.ts`.
- Set `SSLCOMMERZ_LIVE="true"` only on Production.
