import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  merchants: defineTable({
    ownerUserId: v.string(),
    displayName: v.string(),
    contactEmail: v.string(),
    createdAt: v.number(),
  }).index("by_owner", ["ownerUserId"]),

  splitSessions: defineTable({
    merchantId: v.string(),
    reference: v.string(),
    buyerName: v.string(),
    buyerEmail: v.optional(v.string()),
    totalCents: v.number(),
    currency: v.string(),
    method: v.union(v.literal("contributor"), v.literal("multi_card")),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_merchant", ["merchantId"]),

  contributors: defineTable({
    sessionId: v.id("splitSessions"),
    name: v.string(),
    email: v.string(),
    shareCents: v.number(),
    isInitiator: v.boolean(),
    state: v.string(),
    invitedAt: v.number(),
    paidAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  }).index("by_session", ["sessionId"]),

  cardAllocations: defineTable({
    sessionId: v.id("splitSessions"),
    sequence: v.number(),
    amountCents: v.number(),
    cardLabel: v.optional(v.string()),
    last4: v.optional(v.string()),
    state: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_session", ["sessionId"]),

  auditEvents: defineTable({
    sessionId: v.optional(v.id("splitSessions")),
    merchantId: v.optional(v.string()),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    eventType: v.string(),
    fromState: v.optional(v.string()),
    toState: v.optional(v.string()),
    actorType: v.optional(v.string()),
    actorId: v.optional(v.string()),
    payload: v.any(),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),
});
