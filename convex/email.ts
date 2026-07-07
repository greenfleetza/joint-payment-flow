import { v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";

// ---------- queries ----------

export const getSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("splitSessions")
      .filter((q) => q.eq(q.field("reference"), args.sessionId))
      .collect();
    return sessions[0] ?? null;
  },
});

// ---------- mutations ----------

export const updateSessionStatus = internalMutation({
  args: { sessionId: v.id("splitSessions"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { status: args.status, updatedAt: Date.now() });
  },
});

export const markContributorPaid = internalMutation({
  args: {
    contributorId: v.id("contributors"),
    allocations: v.array(
      v.object({ methodId: v.string(), amountCents: v.number() }),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contributorId, {
      state: "paid",
      paidAt: Date.now(),
    });
  },
});

// ---------- actions ----------

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[email] RESEND_API_KEY not set — skipping email send");
      return { success: false, reason: "no_api_key" };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "noreply@zakapay.co",
        to: [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[email] Resend error:", err);
      return { success: false, reason: err };
    }

    const data = await res.json();
    return { success: true, id: data.id };
  },
});

export const createPaymentIntent = action({
  args: {
    amountCents: v.number(),
    currency: v.optional(v.string()),
    sessionId: v.string(),
    contributorId: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.warn("[stripe] STRIPE_SECRET_KEY not set — using mock payment intent");
      return {
        success: true,
        clientSecret: `pi_mock_${Date.now()}_secret`,
        paymentIntentId: `pi_mock_${Date.now()}`,
        mock: true,
      };
    }

    const stripe = (await import("stripe")).default;
    const stripeClient = new stripe(secretKey, { apiVersion: "2026-06-24.dahlia" });

    const intent = await stripeClient.paymentIntents.create({
      amount: args.amountCents,
      currency: args.currency ?? "usd",
      automatic_payment_methods: { enabled: true },
      description: args.description ?? `ZakaPay split — ${args.sessionId}`,
      metadata: {
        sessionId: args.sessionId,
        contributorId: args.contributorId ?? "",
      },
    });

    return {
      success: true,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      mock: false,
    };
  },
});
