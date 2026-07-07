// Centralized Clerk authentication configuration.
// Single source of truth for all auth-related constants and helpers.

import { externalConfig } from "./external-config";

/** The Clerk publishable key from environment variables. */
export const clerkPublishableKey = externalConfig.clerkPublishableKey;

/**
 * Extract the Clerk instance domain from the publishable key.
 * Format: pk_test_<instance-id>.<region>.clerk.accounts.dev
 * Returns the full accounts.dev URL for hosted sign-in/sign-up.
 */
export function getClerkHostedUrl(): string {
  const key = clerkPublishableKey;
  if (!key) return "";

  // Clerk keys follow: pk_test_<instance>.<rest-of-domain>
  const parts = key.split("_");
  if (parts.length < 3) return "";

  // parts[2] = "<instance>.<region>.clerk.accounts.dev"
  const instancePart = parts[2];
  const instanceId = instancePart?.split(".")[0] ?? "";

  if (!instanceId) return "";

  return `https://${instanceId}.accounts.dev`;
}

/**
 * Build the Clerk hosted sign-in URL with a redirect back to the app.
 */
export function getClerkSignInUrl(redirectPath = "/dashboard"): string {
  if (typeof window === "undefined") return "";
  const base = getClerkHostedUrl();
  if (!base) return "";
  const redirectUrl = `${window.location.origin}${redirectPath}`;
  return `${base}/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;
}
