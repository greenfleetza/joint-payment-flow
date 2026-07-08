# ZakaPay — Production Readiness Checklist

Run this list before every promotion from Preview → Production.

## Backend

- [ ] Supabase migrations applied to the prod project.
- [ ] All RLS policies confirmed with `supabase--linter`.
- [ ] `service_role` key rotated within the last 90 days.
- [ ] Stripe webhook endpoint uses the prod signing secret and is idempotent
      by `payment_intent.id`.
- [ ] Resend domain (`zakapay.co`) shows *Verified* for SPF, DKIM, and DMARC.

## Frontend

- [ ] `VITE_APP_URL` matches the prod canonical origin.
- [ ] `og:image` set on every shareable route (landing + `/c/$token`).
- [ ] Bundle size delta since previous release < 5 %.
- [ ] Lighthouse: LCP < 2.5 s, CLS < 0.1, TBT < 200 ms on the checkout flow.

## Payments

- [ ] Live-mode Stripe key installed as `STRIPE_SECRET_KEY`.
- [ ] Split contributor flow tested end-to-end with three contributors on
      three different cards + one wallet.
- [ ] Multi-card flow tested with a deliberate first-card failure to confirm
      retry / replace works and no double capture occurs.
- [ ] Refund flow tested against a live-mode charge.

## Observability

- [ ] Sentry DSN pointed at the prod project; source maps uploaded.
- [ ] PostHog project key set for prod; events tagged with `X-Correlation-Id`.
- [ ] `email_send_log` deduplication query returns expected counts.
- [ ] Alert wired for `PaymentFailed` domain events > 3 % over a rolling hour.

## Security

- [ ] No `console.log` of PII in shipped bundles (grep `email`, `card`, `share`).
- [ ] Contributor links (`/c/…`) verify HMAC + expiry server-side.
- [ ] Rate-limit budgets on `send-invitation`, `send-reminder`, `pay-attempt`
      match the policy in `src/lib/rate-limit.ts`.
- [ ] Content-Security-Policy header allows only the origins we actually use.

## Rollout

- [ ] Feature-flag key exists for any partially rolled behaviour.
- [ ] Rollback plan: previous published build ID recorded.
- [ ] Support inbox monitored for the first hour after deploy.
