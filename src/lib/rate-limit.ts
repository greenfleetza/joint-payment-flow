// Client-side rate limiter — token bucket per action key, persisted in localStorage.
// The platform has no standard backend rate-limiting primitive; this is the honest
// demo-store equivalent. Every gated action calls `check()` before it fires and
// falls back to a user-visible message when the bucket is empty.

const KEY = "zakapay_rate_buckets";

interface Bucket { tokens: number; refilledAt: number }

interface Policy { capacity: number; refillPerSec: number }

const POLICIES: Record<string, Policy> = {
  "send-invitation": { capacity: 10, refillPerSec: 10 / 60 },  // 10 / min
  "send-reminder":   { capacity: 5,  refillPerSec: 5 / 60 },   // 5 / min
  "send-receipt":    { capacity: 20, refillPerSec: 20 / 60 },  // 20 / min
  "pay-attempt":     { capacity: 8,  refillPerSec: 8 / 60 },   // 8 / min
  "share-link":      { capacity: 30, refillPerSec: 30 / 60 },
};

function readBuckets(): Record<string, Bucket> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, Bucket>; }
  catch { return {}; }
}

function writeBuckets(b: Record<string, Bucket>) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(b)); } catch { /* full */ }
}

export interface RateLimitResult { ok: boolean; retryAfterSec: number; remaining: number }

export function checkRateLimit(action: keyof typeof POLICIES | string): RateLimitResult {
  const policy = POLICIES[action] ?? { capacity: 20, refillPerSec: 20 / 60 };
  const buckets = readBuckets();
  const now = Date.now();
  const b = buckets[action] ?? { tokens: policy.capacity, refilledAt: now };
  const elapsed = (now - b.refilledAt) / 1000;
  const refilled = Math.min(policy.capacity, b.tokens + elapsed * policy.refillPerSec);
  if (refilled < 1) {
    buckets[action] = { tokens: refilled, refilledAt: now };
    writeBuckets(buckets);
    const wait = (1 - refilled) / policy.refillPerSec;
    return { ok: false, retryAfterSec: Math.ceil(wait), remaining: 0 };
  }
  buckets[action] = { tokens: refilled - 1, refilledAt: now };
  writeBuckets(buckets);
  return { ok: true, retryAfterSec: 0, remaining: Math.floor(refilled - 1) };
}
