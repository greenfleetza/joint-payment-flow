// Transaction store — keeps every checkout thread's data keyed by tx id.
// Persists to localStorage so data survives page reloads and works across tabs.
import { useSyncExternalStore } from "react";
import { demoSession, type DemoCartItem } from "./demo-session";

export type MethodBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "venmo"
  | "cashapp"
  | "applepay"
  | "googlepay"
  | "paypal"
  | "zelle";

export interface TxMethod {
  id: string;
  kind: "card" | "wallet";
  label: string;
  brand: MethodBrand;
  last4?: string;
}

export interface TxAllocation {
  methodId: string;
  amountCents: number;
}

export type ContributorStatus = "pending" | "paid" | "failed" | "cancelled";

export interface TxContributor {
  id: string;
  name: string;
  email: string;
  shareCents: number;
  isInitiator?: boolean;
  status: ContributorStatus;
  delivery: "sent" | "delivered" | "read" | "undelivered";
  allocations: TxAllocation[];
  coveredByInitiator?: boolean;
  lastReminderAt?: number;
  invitedAt?: number;
}

export interface Transaction {
  id: string;
  kind: "contributor" | "multi_card";
  merchantName: string;
  merchantInitial: string;
  orderReference: string;
  items: DemoCartItem[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  promoCode?: string;
  promoDiscountCents: number;
  contributors: TxContributor[];
  hostAllocations: TxAllocation[];
  methods: TxMethod[];
  status: "collecting" | "processing" | "complete" | "expired" | "failed";
  createdAt: number;
  expiresAt: number;
  failedMethods: string[];
  correlationId?: string;
  receiptsSentAt?: number;
  lastFailureReason?: string;
}

// ---------- default catalog ----------

export const DEFAULT_METHODS: TxMethod[] = [
  { id: "pm_visa", kind: "card", label: "Visa ending in 4242", brand: "visa", last4: "4242" },
  { id: "pm_mc", kind: "card", label: "Mastercard •••• 8890", brand: "mastercard", last4: "8890" },
  { id: "pm_amex", kind: "card", label: "Amex •••• 1004", brand: "amex", last4: "1004" },
  { id: "pm_apple", kind: "wallet", label: "Apple Pay", brand: "applepay" },
  { id: "pm_google", kind: "wallet", label: "Google Pay", brand: "googlepay" },
  { id: "pm_paypal", kind: "wallet", label: "PayPal", brand: "paypal" },
  { id: "pm_venmo", kind: "wallet", label: "Venmo", brand: "venmo" },
  { id: "pm_cash", kind: "wallet", label: "Cash App", brand: "cashapp" },
  { id: "pm_zelle", kind: "wallet", label: "Zelle", brand: "zelle" },
];

// ---------- localStorage persistence ----------

const STORAGE_KEY = "zakapay_transactions";

function loadFromStorage(): Record<string, Transaction> {
  try {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Transaction>;
  } catch {
    return {};
  }
}

function saveToStorage(txs: Record<string, Transaction>) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

// ---------- store ----------

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

// Initialize from localStorage (works across tabs and page reloads)
const state: { txs: Record<string, Transaction> } = { txs: loadFromStorage() };
const listeners = new Set<() => void>();

function emit() {
  saveToStorage(state.txs);
  for (const l of listeners) l();
}

// Listen for storage changes from other tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        state.txs = JSON.parse(e.newValue) as Record<string, Transaction>;
        for (const l of listeners) l();
      } catch { /* ignore */ }
    }
  });
}

function randSuffix(n = 7) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function makeTxId(kind: "contributor" | "multi_card") {
  return (kind === "contributor" ? "C" : "M") + randSuffix(7);
}

function baseTx(id: string, kind: Transaction["kind"]): Transaction {
  return {
    id,
    kind,
    merchantName: demoSession.merchantName,
    merchantInitial: demoSession.merchantLogoInitial,
    orderReference: demoSession.orderReference,
    items: demoSession.items,
    subtotalCents: demoSession.subtotalCents,
    vatCents: demoSession.vatCents,
    totalCents: demoSession.totalCents,
    promoDiscountCents: 0,
    contributors: [],
    hostAllocations: [],
    methods: [...DEFAULT_METHODS],
    status: "collecting",
    createdAt: Date.now(),
    expiresAt: Date.now() + SEVEN_DAYS,
    failedMethods: [],
    correlationId: undefined,
  };
}

export const txStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  get(id: string): Transaction | undefined {
    return state.txs[id];
  },
  getSnapshot() {
    return state.txs;
  },
  ensure(id: string, kind: Transaction["kind"]): Transaction {
    if (!state.txs[id]) {
      state.txs[id] = baseTx(id, kind);
      emit();
    }
    return state.txs[id];
  },
  create(kind: Transaction["kind"]): Transaction {
    const id = makeTxId(kind);
    state.txs[id] = baseTx(id, kind);
    emit();
    return state.txs[id];
  },
  update(id: string, patch: Partial<Transaction>) {
    const cur = state.txs[id];
    if (!cur) return;
    state.txs[id] = { ...cur, ...patch };
    emit();
  },
  setContributors(id: string, contributors: TxContributor[]) {
    this.update(id, { contributors });
  },
  patchContributor(id: string, cid: string, patch: Partial<TxContributor>) {
    const tx = state.txs[id];
    if (!tx) return;
    this.setContributors(
      id,
      tx.contributors.map((c) => (c.id === cid ? { ...c, ...patch } : c)),
    );
  },
  setHostAllocations(id: string, allocations: TxAllocation[]) {
    this.update(id, { hostAllocations: allocations });
  },
  addMethod(id: string, method: TxMethod) {
    const tx = state.txs[id];
    if (!tx) return;
    if (tx.methods.some((m) => m.id === method.id)) return;
    this.update(id, { methods: [...tx.methods, method] });
  },
  applyPromo(id: string, code: string, discountCents: number) {
    this.update(id, { promoCode: code, promoDiscountCents: discountCents });
  },
  markMethodFailed(id: string, methodId: string, reason?: string) {
    const tx = state.txs[id];
    if (!tx) return;
    const failed = tx.failedMethods.includes(methodId) ? tx.failedMethods : [...tx.failedMethods, methodId];
    this.update(id, { failedMethods: failed, lastFailureReason: reason, status: "failed" });
  },
  clearFailedMethods(id: string) {
    const tx = state.txs[id];
    if (!tx) return;
    this.update(id, { failedMethods: [], lastFailureReason: undefined, status: "collecting" });
  },
  cancelContributor(id: string, cid: string) {
    this.patchContributor(id, cid, { status: "cancelled" });
  },
  coverContributor(id: string, cid: string) {
    // Mark that the initiator will cover this share; caller then routes to /pay?to=cid.
    this.patchContributor(id, cid, { coveredByInitiator: true });
  },
  markReceiptsSent(id: string) {
    this.update(id, { receiptsSentAt: Date.now() });
  },
  setCorrelationId(id: string, cid: string) {
    const tx = state.txs[id];
    if (!tx || tx.correlationId) return;
    this.update(id, { correlationId: cid });
  },
  markExpiredIfNeeded(id: string): boolean {
    const tx = state.txs[id];
    if (!tx) return false;
    if (tx.status === "expired") return true;
    if (Date.now() > tx.expiresAt && tx.status !== "complete") {
      this.update(id, { status: "expired" });
      return true;
    }
    return false;
  },
};

// ---------- hooks ----------

export function useTransaction(id: string | undefined): Transaction | undefined {
  return useSyncExternalStore(
    txStore.subscribe,
    () => (id ? state.txs[id] : undefined),
    () => undefined,
  );
}

// ---------- selectors ----------

export function txFinalTotal(tx: Transaction): number {
  return tx.totalCents - tx.promoDiscountCents;
}

export function txPaidContributors(tx: Transaction): TxContributor[] {
  return tx.contributors.filter((c) => c.status === "paid");
}

export function txPaidCents(tx: Transaction): number {
  return txPaidContributors(tx).reduce((a, c) => a + c.shareCents, 0);
}
