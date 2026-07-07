import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
import { externalConfig } from "./external-config";

export function initObservability() {
  if (typeof window === "undefined") return;

  const sentryDsn = externalConfig.sentryDsn;
  const posthogKey = externalConfig.posthogKey;
  const environment = import.meta.env.MODE;

  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      release: import.meta.env.VITE_APP_VERSION ?? "dev",
    });
  }

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: externalConfig.posthogHost,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      loaded: () => {
        posthog.identify(import.meta.env.VITE_POSTHOG_DISTINCT_ID ?? "anonymous");
      },
    });
  }
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!externalConfig.posthogKey) return;
  posthog.capture(event, properties);
}
