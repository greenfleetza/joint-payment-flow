
# ZakaPay MVP — Implementation Plan

## Understanding

Building the ZakaPay MVP per the 10 canonical docs, adapted to Lovable's stack. Product terminology, workflows, state machines, and acceptance criteria come verbatim from the docs. Visual language comes from `design-system-fluid-intelligence.md` (user override of the master prompt).

**Stack substitutions** (infra only — no product change):
- Next.js → TanStack Start (already scaffolded)
- Convex → Lovable Cloud (Supabase Postgres + Realtime + Edge)
- Clerk → Lovable Cloud Auth (email/password + Google)
- Stripe, Resend, Sentry, PostHog → same providers (wired later, mocked for MVP-1)

## Scope

**In scope (this plan):**
1. Design system: Fluid Intelligence tokens (colors, gradients, glass, motion, radii, spacing) wired into `src/styles.css` + Tailwind v4 `@theme`, Inter font, dark mode.
2. Component library extensions on top of shadcn: `GlassCard`, `AmbientBackground`, `AmountDisplay`, `ProgressRing`, `ContributorRow`, `PaymentStatusPill`, `SplitMethodTile`, `StepHeader`, `CopyLinkButton`, motion primitives.
3. App shell + routing per App-Flow screen inventory.
4. **Checkout + Contributor Split** — S01 Split Method, S02 Contributor Setup, S03 Invitation Sent, S04 Pay Your Share, S05 Contributor Payment, S06 Contributor Status, S09 Payment Complete.
5. **Multi-Card Split** — S07 Multi-Card Setup, S08 Payment Processing, S09 Payment Complete.
6. **Merchant Dashboard** — Auth, sessions list, session detail, refunds panel, settings, analytics.
7. Enable Lovable Cloud; canonical schema (merchants, merchantSettings, splitSessions, contributors, cardAllocations, payments, refunds, notifications, auditEvents, webhookEvents) with RLS + `has_role` + audit triggers.
8. Contributor signed-token route (public, no auth).
9. State machines wired to Postgres enums + realtime subscriptions.
10. Stripe / Resend / PostHog / Sentry: interfaces + env stubs, mock adapter behind flag so full UI is demoable end-to-end. Real key wiring is a follow-up phase.

**Out of scope (later phases):**
- Live Stripe Connect onboarding + real Payment Intents + manual capture webhooks
- Resend delivery, Sentry ingestion, PostHog events
- Admin console, feature flag UI, embeddable widget SDK build
- SAML SSO, phone auth

## Dependencies

- **04-UIUX-Design-Brief.md** + `design-system-fluid-intelligence.md` → tokens & components
- **03-App-Flow.md** → route tree + screen behavior
- **05-Backend-Schema.md** + **09-Database.md** → Supabase schema, enums, indexes
- **06-Security.md** → RLS, roles table, contributor token signing, audit events
- **07-Architecture.md** → state machines, event log
- **08-API.md** → server function surface
- **10-Features.md** → acceptance criteria per feature
- **11-Implementation-Plan.md** → phase ordering

## Design Direction — Fluid Intelligence (locked)

- **Palette:** `--bg-primary #F5F5F7`, `--bg-secondary #FFF`, glass `rgba(255,255,255,0.72)` w/ border `rgba(255,255,255,0.4)`; dark: `#000` / `#1C1C1E`. Accents: blue `#0071E3` (primary + AI), purple `#5E5CE6`, teal `#64D2FF` (success), pink `#FF375F` (destructive), orange `#FF9F0A` (warning).
- **Gradients:** Aurora backgrounds behind hero surfaces; ambient blurred blobs (150px blur, low opacity) as canvas layer only — never on interactive elements.
- **Glass:** `backdrop-filter: blur(24px) saturate(140%)` via Tailwind `backdrop-blur-xl` + `bg-white/70` semantic utility. Standard property only (no `-webkit-` twin).
- **Typography:** Inter via `@fontsource-variable/inter`. Scale: 12/14/16/18/24/32/48. Tabular numerals for amounts.
- **Radii:** 8/12/16/24 (glass surfaces = 24).
- **Motion:** Framer Motion springs (stiffness 350, damping 30); micro 150–250ms; page 350ms; list stagger 40ms; button tap scale 0.97; respects `prefers-reduced-motion`.
- **Ambient canvas:** subtle animated aurora gradient behind checkout and dashboard hero, GPU-accelerated, pausable.

## Route Tree (TanStack)

```
/                          → Marketing landing (brief)
/checkout/$sessionId       → S01 method picker (entry from merchant)
/checkout/$sessionId/contributors    → S02
/checkout/$sessionId/invited         → S03
/checkout/$sessionId/pay             → S04 (initiator)
/checkout/$sessionId/status          → S06 live progress
/checkout/$sessionId/cards           → S07 multi-card
/checkout/$sessionId/processing      → S08
/checkout/$sessionId/complete        → S09
/c/$token                  → S05 contributor public payment (signed token, no auth)
/auth                      → sign-in / sign-up (Lovable Cloud)
/_authenticated/dashboard  → sessions overview
/_authenticated/sessions   → list
/_authenticated/sessions/$id → detail + refunds
/_authenticated/analytics
/_authenticated/settings
/api/public/webhooks/stripe → signed webhook handler (stubbed)
```

Each route ships own `head()` metadata. Contributor route is public + no-index.

## Implementation Phases

### Phase 1 — Foundation (design system + shell)
1. Install `@fontsource-variable/inter`, `framer-motion`, `zod`, `date-fns`.
2. Rewrite `src/styles.css`: Fluid Intelligence tokens under `:root` + `.dark`, mapped into `@theme inline`, custom utilities `@utility glass`, `@utility glass-strong`, `@utility aurora-bg`, tabular-nums utility.
3. Add `ThemeProvider` (system default), `AmbientBackground` canvas component, motion presets in `src/lib/motion.ts`.
4. Extend shadcn set with ZakaPay primitives listed above.
5. Build marketing landing at `/` explaining product (kills placeholder).

### Phase 2 — Data layer (Lovable Cloud)
1. Enable Cloud via `supabase--enable`.
2. Migration: enums (`split_method`, `session_state`, `payment_state`, `contributor_state`, `refund_state`, `app_role`); tables per §4 of 09-Database.md; indexes; `updated_at` triggers; append-only guards on payments/refunds via `BEFORE UPDATE` trigger.
3. `user_roles` table + `has_role()` security-definer function (merchant / admin).
4. RLS policies scoped to merchant ownership; contributor rows readable only via server fn that verifies signed token.
5. Realtime publications on `split_sessions`, `contributors`, `card_allocations`, `payments`.
6. Seed migration: demo merchant + demo split session for preview.

### Phase 3 — Server functions (API surface)
Per 08-API.md, all as `createServerFn` (or `/api/public/*` route for webhooks + contributor token verify):
- `createSplitSession`, `getSplitSession`, `chooseMethod`
- `addContributor`, `removeContributor`, `resendInvite`, `verifyContributorToken` (public)
- `createCardAllocation`, `removeCardAllocation`
- `initiatePayment` (mock Stripe adapter behind `PAYMENTS_MODE=mock|live`), `capturePayment`, `voidPayment`
- `createRefund`, `listRefunds`
- `listSessions`, `getSessionDetail`, `analyticsSummary`
- `listAuditEvents`
- Webhook route `/api/public/webhooks/stripe` — HMAC verify + idempotent event log into `webhook_events`.

Bearer attacher registered in `src/start.ts`.

### Phase 4 — Contributor Split UI (S01–S06, S09)
End-to-end with realtime subscriptions and mock adapter driving state transitions on a short timer, so the full happy path + failure/retry paths are demoable.

### Phase 5 — Multi-Card Split (S07, S08, S09)
Card allocation editor with running remainder, validation (sum = total), sequential authorization visualization.

### Phase 6 — Merchant Dashboard
Sidebar shell, sessions table (filter/search/status), detail drawer w/ contributors, payments, refunds, audit timeline, refund flow with confirm dialog, analytics cards (volume, success rate, avg contributors, refund rate) from `analyticsSummary`.

### Phase 7 — Polish & a11y
- WCAG AA contrast pass on glass surfaces (fallback solid backgrounds when contrast fails).
- Keyboard nav, visible focus rings, 44px targets.
- Reduced-motion variants.
- Empty / error / loading states for every route (`errorComponent` + `notFoundComponent` on every route with a loader).
- SEO: distinct `head()` per route.

## Component Inventory (new)

`AmbientBackground`, `GlassCard`, `GlassPanel`, `AmountDisplay`, `SplitMethodTile`, `ContributorRow`, `ContributorAvatarStack`, `PaymentStatusPill`, `ProgressRing`, `StepHeader`, `CopyLinkButton`, `CardAllocationEditor`, `SessionTimeline`, `RefundDialog`, `MotionList` (stagger wrapper), `AuroraCanvas`.

## Motion Specs

| Trigger | Duration | Curve | Purpose |
|---|---|---|---|
| Route change | 350ms | spring(350, 30) | Continuity |
| Sheet open | 350ms | spring(320, 28) | Drawer reveal |
| List item enter | 200ms + 40ms stagger | spring | Progressive disclosure |
| Button tap | 120ms | scale 0.97 → 1 | Tactile feedback |
| Amount count-up | 600ms | easeOut | Confirmation |
| Status pill change | 180ms | spring(400, 30) | State clarity |
| Ambient gradient | 20s loop | linear (paused w/ reduce-motion) | Living surface |

## Accessibility

- All glass surfaces validated: text-on-glass uses `--text-primary` on ≥60% opaque layer; auto-swap to solid when reduced-transparency preferred.
- `aria-live="polite"` on contributor status updates and payment progress.
- Focus trap in dialogs/sheets; ESC closes.
- Skip-to-content link on dashboard shell.
- Reduced motion → replace springs with instant transitions and pause aurora.

## Security

- Contributor tokens: HMAC-signed (server secret `CONTRIBUTOR_TOKEN_SECRET` via `generate_secret`), 1-hour expiry, session-scoped, single-use verification writes an `audit_event`.
- All financial mutations idempotency-keyed and RLS-restricted to merchant owner or verified contributor token.
- Roles in `user_roles` table + `has_role()` — never on profile.
- Audit log write on every state transition; append-only enforced by trigger.

## Acceptance Criteria (from 10-Features.md)

- **F-001** Embedded Checkout: session created → method selectable → progresses to chosen workflow without page reload artifacts.
- **F-002** Contributor Split: initiator can add ≥1 contributors summing to total; invites generate signed links; contributor status updates in realtime; session completes only when all contributors settle.
- **F-003** Multi-Card Split: user configures ≥2 cards summing to exact total; sequential authorization; single merchant-visible success.
- **F-004** Manual capture: authorized → captured on completion; voids on expiry/failure.
- **F-005** Dashboard lists sessions with state filters; detail view shows contributors, payments, audit trail.
- **F-006** Contributor payment links are single-session-scoped and expire.
- **F-007** Realtime status reflects backend changes within 1s.
- **F-008** Refund available on captured payments; partial + full; audited.
- **F-009** Email hooks fire on invite, payment, completion, refund (mock adapter logs; real Resend later).
- **F-010** Analytics cards render volume, success rate, avg contributors, refund rate.
- **F-011** Every state transition writes an `audit_event`.
- **F-012** Feature flags read from a `feature_flags` table (server fn).

## Risks

- **Glass + Fluid Intelligence vs WCAG AA on light mode** (04-UIUX / 06-Security §a11y): mitigated via opacity floor + solid fallback.
- **Stripe orchestration is mocked in MVP-1** (07-Architecture §payment authority): mock adapter is behind an env flag and interfaces mirror real Stripe SDK signatures so the swap is mechanical.
- **Realtime consistency** (07-Architecture ARC-002): Supabase realtime is application-authority mirror; final payment truth still reconciled via webhook events log (stubbed).
- **RLS complexity for contributor public routes** (06-Security): contributor reads/writes go through a single server fn that validates the HMAC token — never direct table access from `/c/$token`.
- **Tailwind v4 constraints** (`tailwind4-*`): Inter loaded via fontsource package, `backdrop-filter` written as standard property only, custom utilities via `@utility`.

## First-turn deliverables (once approved)

Phase 1 + Phase 2 in a single build:
- Fluid Intelligence tokens + fonts + ambient background
- Route shell for every screen with premium empty states
- Cloud enabled + full canonical schema migration + roles + seed
- Marketing landing replacing placeholder

Subsequent turns pick up Phases 3 → 6 → 7.
