import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("splitSessions").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("splitSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    merchantId: v.string(),
    reference: v.string(),
    buyerName: v.string(),
    buyerEmail: v.optional(v.string()),
    totalCents: v.number(),
    currency: v.string(),
    method: v.union(v.literal("contributor"), v.literal("multi_card")),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("splitSessions", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addContributor = mutation({
  args: {
    sessionId: v.id("splitSessions"),
    name: v.string(),
    email: v.string(),
    shareCents: v.number(),
    isInitiator: v.boolean(),
    state: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contributors", {
      ...args,
      invitedAt: Date.now(),
    });
  },
});

export const addAuditEvent = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditEvents", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
