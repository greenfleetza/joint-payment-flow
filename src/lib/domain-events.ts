// Domain event bus — emit typed events; subscribers side-effect (email, analytics).
// Events are also persisted to localStorage for the audit timeline.

export type DomainEvent =
  | { type: "SessionCreated"; txId: string; at: number; correlationId: string; kind: "contributor" | "multi_card" }
  | { type: "ContributorInvited"; txId: string; contributorId: string; at: number; correlationId: string }
  | { type: "ContributorReminded"; txId: string; contributorId: string; at: number; correlationId: string }
  | { type: "ContributorCancelled"; txId: string; contributorId: string; at: number; correlationId: string }
  | { type: "PaymentAttempted"; txId: string; contributorId: string | null; methodId: string; at: number; correlationId: string; actionId: string }
  | { type: "PaymentSucceeded"; txId: string; contributorId: string | null; methodId: string; amountCents: number; at: number; correlationId: string }
  | { type: "PaymentFailed";    txId: string; contributorId: string | null; methodId: string; reason: string; at: number; correlationId: string }
  | { type: "InitiatorCoveredContributor"; txId: string; contributorId: string; amountCents: number; at: number; correlationId: string }
  | { type: "SessionCompleted"; txId: string; at: number; correlationId: string }
  | { type: "SessionExpired";   txId: string; at: number; correlationId: string }
  | { type: "ReceiptsDispatched"; txId: string; recipientCount: number; at: number; correlationId: string };

type Handler = (e: DomainEvent) => void | Promise<void>;

const AUDIT_KEY = "zakapay_audit_log";
const subscribers = new Set<Handler>();

function appendAudit(e: DomainEvent) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const arr: DomainEvent[] = raw ? JSON.parse(raw) : [];
    arr.push(e);
    // Cap at 500 events.
    localStorage.setItem(AUDIT_KEY, JSON.stringify(arr.slice(-500)));
  } catch { /* ignore */ }
}

export function subscribe(fn: Handler): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function emit(e: DomainEvent) {
  appendAudit(e);
  // eslint-disable-next-line no-console
  console.log(`[event:${e.type}] [${e.correlationId}]`, e);
  for (const h of subscribers) {
    try { void h(e); } catch { /* subscriber errors don't break producer */ }
  }
}

export function readAudit(txId?: string): DomainEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const arr: DomainEvent[] = JSON.parse(localStorage.getItem(AUDIT_KEY) ?? "[]");
    return txId ? arr.filter((e) => "txId" in e && e.txId === txId) : arr;
  } catch { return []; }
}
