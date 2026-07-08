// Network interruption recovery — queue mutations while offline, flush on reconnect.
// Consumers register their flush handler via `registerFlusher`. `enqueue()` stores
// a serializable payload; on `online` we replay them in order.

import { toast } from "sonner";

const QUEUE_KEY = "zakapay_offline_queue";

export interface QueuedAction {
  id: string;
  kind: string;
  payload: unknown;
  createdAt: number;
}

type Flusher = (a: QueuedAction) => Promise<void> | void;
const flushers = new Map<string, Flusher>();

function read(): QueuedAction[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]"); }
  catch { return []; }
}

function write(q: QueuedAction[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* ignore */ }
}

export function enqueue(kind: string, payload: unknown) {
  const q = read();
  q.push({ id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, kind, payload, createdAt: Date.now() });
  write(q);
}

export function registerFlusher(kind: string, fn: Flusher) {
  flushers.set(kind, fn);
}

export function isOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

let installed = false;
let listeners = new Set<(online: boolean) => void>();

export function onConnectivityChange(cb: (online: boolean) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

async function flush() {
  const q = read();
  if (q.length === 0) return;
  const kept: QueuedAction[] = [];
  for (const a of q) {
    const fn = flushers.get(a.kind);
    if (!fn) { kept.push(a); continue; }
    try { await fn(a); } catch { kept.push(a); }
  }
  write(kept);
  if (kept.length === 0 && q.length > 0) {
    toast.success(`Reconnected — synced ${q.length} pending action${q.length === 1 ? "" : "s"}`);
  }
}

export function installNetworkRecovery() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  let wasOnline = navigator.onLine;
  window.addEventListener("online", async () => {
    if (!wasOnline) toast.success("Back online");
    wasOnline = true;
    listeners.forEach((l) => l(true));
    await flush();
  });
  window.addEventListener("offline", () => {
    wasOnline = false;
    listeners.forEach((l) => l(false));
    toast.warning("You're offline — actions will resume when you reconnect");
  });
  // Retry on load if there are queued items and we're online.
  if (navigator.onLine) void flush();
}
