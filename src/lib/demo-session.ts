// Demo split-session for previewing checkout flows without a backend.
export type ContributorStatus =
  | "invited"
  | "viewed"
  | "processing"
  | "authorized"
  | "paid"
  | "failed"
  | "expired";

export type DeliveryStatus = "read" | "sent" | "delivered" | "undelivered";

export type SessionStatus =
  | "collecting"
  | "processing"
  | "completed"
  | "failed"
  | "expired";

export interface DemoContributor {
  id: string;
  name: string;
  email: string;
  shareCents: number;
  status: ContributorStatus;
  delivery?: DeliveryStatus;
  isInitiator?: boolean;
}

export interface DemoCartItem {
  id: string;
  name: string;
  qty: number;
  unitCents: number;
}

export interface DemoPaymentMethod {
  id: string;
  kind: "card" | "wallet";
  label: string;
  brand: "visa" | "mastercard" | "amex" | "venmo" | "cashapp" | "applepay" | "paypal";
}

export interface DemoSession {
  id: string;
  transactionCode: string; // starts with C…
  merchantName: string;
  merchantLogoInitial: string;
  orderReference: string;
  items: DemoCartItem[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  currency: string;
  status: SessionStatus;
  contributors: DemoContributor[];
  paymentMethods: DemoPaymentMethod[];
  createdAt: string;
}

export const demoSession: DemoSession = {
  id: "sess_demo_01",
  transactionCode: "C7F3M2AK",
  merchantName: "Northwind Threads",
  merchantLogoInitial: "N",
  orderReference: "NW-4821",
  items: [
    { id: "i1", name: "Merino Overshirt", qty: 1, unitCents: 12800 },
    { id: "i2", name: "Utility Trouser", qty: 1, unitCents: 7936 },
    { id: "i3", name: "Field Cap", qty: 1, unitCents: 1900 },
  ],
  subtotalCents: 22636,
  vatCents: 2264,
  totalCents: 24900,
  currency: "USD",
  status: "collecting",
  createdAt: new Date().toISOString(),
  contributors: [
    { id: "c1", name: "You", email: "you@example.com", shareCents: 8300, status: "authorized", isInitiator: true },
    { id: "c2", name: "Sasha Morgan", email: "sasha@example.com", shareCents: 8300, status: "paid", delivery: "read" },
    { id: "c3", name: "Priya Rao", email: "priya@example.com", shareCents: 8300, status: "viewed", delivery: "delivered" },
  ],
  paymentMethods: [
    { id: "pm1", kind: "card", label: "Visa ending in 4242", brand: "visa" },
    { id: "pm2", kind: "card", label: "Mastercard •••• 8890", brand: "mastercard" },
    { id: "pm3", kind: "card", label: "Amex •••• 1004", brand: "amex" },
    { id: "pm4", kind: "wallet", label: "Venmo", brand: "venmo" },
    { id: "pm5", kind: "wallet", label: "Cash App", brand: "cashapp" },
  ],
};

export function sumPaid(session: DemoSession): number {
  return session.contributors
    .filter((c) => c.status === "paid" || c.status === "authorized" || c.status === "processing")
    .reduce((acc, c) => acc + c.shareCents, 0);
}
