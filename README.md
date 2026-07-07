# ZakaPay joint payment flow

## Implementation progress

### Completed
- Added Convex, Clerk, Sentry, PostHog, Stripe, and Resend configuration scaffolding with environment-based settings.
- Wired the app shell to initialize Clerk, Convex, Sentry, and PostHog providers.
- Updated the contributor setup flow to support editable host/contributor rows, direct amount entry, and a split-evenly action near the add contributor control.
- Updated the invitation sent screen to surface the generated share link in a centered, copyable card.
- Updated the contributor status screen with revised labeling, reminder copy, and contributor-specific share-link actions.
- Updated the pay-your-share and multi-card screens to use the same split-evenly placement and to keep the primary action enabled only when the selected methods fully cover the total.

### Remaining work
- Connect the app to a live Convex deployment and replace the in-memory transaction store with persisted backend data where needed.
- Add real email dispatch and payment intent orchestration through Resend and Stripe.
- Wire Clerk-authenticated merchant and contributor flows beyond the current local demo shell.

## Local verification
- Install dependencies with npm install.
- Start the app with npm run dev.
- Build the app with npm run build.
