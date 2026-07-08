# ZakaPay — Environment Strategy

ZakaPay runs in three tiers. Each tier has its own set of secrets and its own
sender identity. **Never** share secrets between tiers.

## Tiers

| Tier        | URL pattern                                | Purpose                             |
| ----------- | ------------------------------------------ | ----------------------------------- |
| Local dev   | `http://localhost:8080`                    | Developer machines. Test data only. |
| Preview     | `https://<project>--<id>-dev.lovable.app`  | Every branch build. QA + review.    |
| Production  | `https://<project>.lovable.app` / custom   | Real customers, real money.         |

## Required env vars

Server-side (set via **Add secret**):

| Name                            | Local        | Preview      | Production   |
| ------------------------------- | ------------ | ------------ | ------------ |
| `RESEND_API_KEY`                | test key     | test key     | live key     |
| `EMAIL_FROM`                    | `noreply@zakapay.co` | same | same         |
| `STRIPE_SECRET_KEY`             | `sk_test_…`  | `sk_test_…`  | `sk_live_…`  |
| `SUPABASE_URL` (auto)           | dev project  | dev project  | prod project |
| `SUPABASE_SERVICE_ROLE_KEY` (auto) | dev       | dev          | prod         |
| `SUPABASE_PUBLISHABLE_KEY` (auto)  | dev       | dev          | prod         |

Client-side (`VITE_*`, safe to ship to browser):

| Name                          | Notes                                   |
| ----------------------------- | --------------------------------------- |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` in dev/preview, `pk_live_…` in prod |
| `VITE_APP_URL`                | Base URL used in email links            |
| `VITE_SUPABASE_URL` (auto)    |                                         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` (auto) |                                |

## Rules

1. Every secret change goes through **Add secret** — never in a committed `.env`.
2. Prod uses `sk_live_…` and a **verified** Resend sending domain. Preview may
   use `onboarding@resend.dev` for developer inboxes only.
3. `VITE_APP_URL` must match the environment's canonical origin so signed
   contributor links resolve on the same host that issued them.
4. Rotate keys on a quarterly cadence and after any suspected leak. Rotation
   for Lovable-managed secrets happens via the platform's rotation tool.
5. When adding a new env var, document it here **and** in
   `.env.example` in the same commit.
