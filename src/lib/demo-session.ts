// Demo split-session for previewing checkout flows without a backend.
// Real product code goes through server functions; this powers the UI shell
// so the App-Flow screens are demoable end-to-end.
export type ContributorStatus =
  | "invited"
  | "viewed"
  | "processing"
  | "authorized"
  | "paid"
  | "failed"
  | "expired";

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
  isInitiator?: boolean;
}

export interface DemoSession {
  id: string;
  merchantName: string;
  merchantLogoInitial: string;
  orderReference: string;
  totalCents: number;
  currency: string;
  status: SessionStatus;
  contributors: DemoContributor[];
  createdAt: string;
}

export const demoSession: DemoSession = {
  id: "sess_demo_01",
  merchantName: "Northwind Threads",
  merchantLogoInitial: "N",
  orderReference: "NW-4821",
  totalCents: 24900,
  currency: "USD",
  status: "collecting",
  createdAt: new Date().toISOString(),
  contributors: [
    { id: "c1", name: "You", email: "you@example.com", shareCents: 8300, status: "authorized", isInitiator: true },
    { id: "c2", name: "Sasha Morgan", email: "sasha@example.com", shareCents: 8300, status: "paid" },
    { id: "c3", name: "Priya Rao", email: "priya@example.com", shareCents: 8300, status: "viewed" },
  ],
};

export function sumPaid(session: DemoSession): number {
  return session.contributors
    .filter((c) => c.status === "paid" || c.status === "authorized" || c.status === "processing")
    .reduce((acc, c) => acc + c.shareCents, 0);
}
