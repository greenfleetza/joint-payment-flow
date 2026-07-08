// Correlation IDs — one per browser session; attached to every server call / log line.
// Kept in sessionStorage so a single browser tab reuses the same ID across reloads.

const KEY = "zakapay_correlation_id";

function makeId() {
  const rand = (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `zpc_${rand}`;
}

export function getCorrelationId(): string {
  if (typeof window === "undefined") return "zpc_ssr";
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const id = makeId();
    sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    return makeId();
  }
}

// Fresh ID scoped to a single action (payment, retry, email send).
export function newActionId(prefix = "act"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function tagLog(msg: string, extra?: Record<string, unknown>) {
  const cid = getCorrelationId();
  // eslint-disable-next-line no-console
  console.log(`[${cid}] ${msg}`, extra ?? "");
}
