// Cryptographically signed contributor payment links (HMAC-SHA256 via WebCrypto).
// The signing key lives client-side in the demo store — in production it would be a
// server secret and verification would run in a server function. Format:
//   /c/<txId>?to=<contribId>&exp=<unixSec>&sig=<base64url>
// Verification checks both the HMAC and expiry timestamp.

const KEY_STORAGE = "zakapay_signing_key_v1";

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  const norm = s.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((s.length + 3) % 4);
  const bin = atob(norm);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function getSigningKey(): Promise<CryptoKey> {
  if (typeof window === "undefined" || !crypto?.subtle) {
    throw new Error("WebCrypto unavailable");
  }
  let raw = localStorage.getItem(KEY_STORAGE);
  if (!raw) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    raw = bytesToBase64Url(bytes);
    localStorage.setItem(KEY_STORAGE, raw);
  }
  const bytes = base64UrlToBytes(raw);
  return crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getSigningKey();
  const enc = new TextEncoder().encode(payload);
  const sig = await crypto.subtle.sign("HMAC", key, enc);
  return bytesToBase64Url(new Uint8Array(sig));
}

export interface SignedLinkParams {
  txId: string;
  contributorId: string;
  ttlSeconds?: number; // default 7 days
}

export async function buildSignedContributorLink(
  origin: string,
  { txId, contributorId, ttlSeconds = 60 * 60 * 24 * 7 }: SignedLinkParams,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${txId}.${contributorId}.${exp}`;
  const sig = await sign(payload);
  return `${origin}/c/${txId}?to=${encodeURIComponent(contributorId)}&exp=${exp}&sig=${sig}`;
}

export async function verifySignedLink(
  txId: string,
  contributorId: string,
  exp: number,
  sig: string,
): Promise<{ ok: boolean; reason?: "expired" | "bad_signature" }> {
  if (Number.isFinite(exp) && exp * 1000 < Date.now()) return { ok: false, reason: "expired" };
  try {
    const key = await getSigningKey();
    const payload = `${txId}.${contributorId}.${exp}`;
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(sig),
      new TextEncoder().encode(payload),
    );
    return ok ? { ok: true } : { ok: false, reason: "bad_signature" };
  } catch {
    return { ok: false, reason: "bad_signature" };
  }
}
