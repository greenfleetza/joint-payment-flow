// Convex action wrappers — send emails via Resend and create Stripe PaymentIntents.
// Gracefully degrade when Convex is not deployed or API is unavailable.

import { externalConfig } from "./external-config";

type EmailResult = { success: boolean; id?: string; reason?: string };
type PaymentIntentResult = {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  mock?: boolean;
  reason?: string;
};

/**
 * Send an email via the Convex sendEmail action (Resend API).
 * Falls back to console.warn when Convex is unavailable.
 */
export async function sendEmailViaResend({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<EmailResult> {
  const convexUrl = externalConfig.convexUrl;
  if (!convexUrl) {
    console.warn("[email] Convex not configured — skipping Resend email");
    return { success: false, reason: "no_convex_url" };
  }

  try {
    // Call the Convex HTTP action endpoint for sendEmail
    const res = await fetch(`${convexUrl}/api/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "email:sendEmail",
        args: { to, subject, html, text },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[email] Convex action failed:", err);
      return { success: false, reason: err };
    }

    const data = await res.json();
    return data as EmailResult;
  } catch (err) {
    console.error("[email] Failed to call Convex action:", err);
    return { success: false, reason: String(err) };
  }
}

/**
 * Create a Stripe PaymentIntent via the Convex createPaymentIntent action.
 * Falls back to mock when Convex or Stripe is unavailable.
 */
export async function createStripePaymentIntent({
  amountCents,
  currency = "usd",
  sessionId,
  contributorId,
  description,
}: {
  amountCents: number;
  currency?: string;
  sessionId: string;
  contributorId?: string;
  description?: string;
}): Promise<PaymentIntentResult> {
  const convexUrl = externalConfig.convexUrl;
  if (!convexUrl) {
    console.warn("[stripe] Convex not configured — using mock payment intent");
    return {
      success: true,
      clientSecret: `pi_mock_${Date.now()}_secret`,
      paymentIntentId: `pi_mock_${Date.now()}`,
      mock: true,
    };
  }

  try {
    const res = await fetch(`${convexUrl}/api/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "email:createPaymentIntent",
        args: { amountCents, currency, sessionId, contributorId, description },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[stripe] Convex action failed:", err);
      // Fall back to mock
      return {
        success: true,
        clientSecret: `pi_mock_${Date.now()}_secret`,
        paymentIntentId: `pi_mock_${Date.now()}`,
        mock: true,
        reason: err,
      };
    }

    const data = await res.json();
    return data as PaymentIntentResult;
  } catch (err) {
    console.error("[stripe] Failed to call Convex action:", err);
    return {
      success: true,
      clientSecret: `pi_mock_${Date.now()}_secret`,
      paymentIntentId: `pi_mock_${Date.now()}`,
      mock: true,
      reason: String(err),
    };
  }
}
