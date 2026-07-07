const env = import.meta.env;

export const externalConfig = {
  convexUrl: env.VITE_CONVEX_URL ?? env.NEXT_PUBLIC_CONVEX_URL ?? "",
  clerkPublishableKey: env.VITE_CLERK_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  sentryDsn: env.VITE_SENTRY_DSN ?? env.SENTRY_DSN ?? "",
  posthogKey: env.VITE_POSTHOG_KEY ?? env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  posthogHost: env.VITE_POSTHOG_HOST ?? env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
  stripePublishableKey: env.VITE_STRIPE_PUBLISHABLE_KEY ?? env.STRIPE_PUBLISHABLE_KEY ?? "",
  stripeSecretKey: env.STRIPE_SECRET_KEY ?? "",
  appUrl: env.VITE_APP_URL ?? env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  resendApiKey: env.VITE_RESEND_API_KEY ?? env.RESEND_API_KEY ?? "",
  emailFrom: env.VITE_EMAIL_FROM ?? env.EMAIL_FROM ?? "noreply@zakapay.co",
} as const;
