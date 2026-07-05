// Demo dashboard data (until Phase 3 server fns land)
import type { ContributorStatus, SessionStatus } from "@/lib/demo-session";

export interface DemoRowSession {
  id: string;
  reference: string;
  totalCents: number;
  currency: string;
  method: "contributor" | "multi_card";
  status: SessionStatus;
  contributorCount: number;
  createdAt: string;
  buyer: string;
}

export const demoSessions: DemoRowSession[] = [
  { id: "sess_01H001", reference: "NW-4821", totalCents: 24900, currency: "USD", method: "contributor", status: "collecting", contributorCount: 3, createdAt: "2h ago", buyer: "Sasha Morgan" },
  { id: "sess_01H002", reference: "NW-4820", totalCents: 89900, currency: "USD", method: "contributor", status: "completed", contributorCount: 4, createdAt: "Yesterday", buyer: "Priya Rao" },
  { id: "sess_01H003", reference: "NW-4819", totalCents: 15900, currency: "USD", method: "multi_card", status: "completed", contributorCount: 2, createdAt: "Yesterday", buyer: "M. Chen" },
  { id: "sess_01H004", reference: "NW-4818", totalCents: 42500, currency: "USD", method: "contributor", status: "expired", contributorCount: 3, createdAt: "3d ago", buyer: "A. Silva" },
  { id: "sess_01H005", reference: "NW-4817", totalCents: 129900, currency: "USD", method: "contributor", status: "completed", contributorCount: 6, createdAt: "4d ago", buyer: "T. Nakamura" },
  { id: "sess_01H006", reference: "NW-4816", totalCents: 32000, currency: "USD", method: "multi_card", status: "failed", contributorCount: 2, createdAt: "5d ago", buyer: "L. Dupont" },
  { id: "sess_01H007", reference: "NW-4815", totalCents: 74900, currency: "USD", method: "contributor", status: "completed", contributorCount: 3, createdAt: "1w ago", buyer: "R. Osei" },
];

export interface DemoAuditEvent {
  id: string;
  at: string;
  entity: string;
  eventType: string;
  from?: string;
  to?: string;
}

export const demoAudit: DemoAuditEvent[] = [
  { id: "a1", at: "2m ago", entity: "SplitSession", eventType: "session.contributor_paid", from: "collecting", to: "collecting" },
  { id: "a2", at: "12m ago", entity: "SplitSession", eventType: "session.invited", from: "created", to: "collecting" },
  { id: "a3", at: "12m ago", entity: "SplitSession", eventType: "session.method_selected", from: "awaiting_method", to: "created" },
  { id: "a4", at: "13m ago", entity: "SplitSession", eventType: "session.created", to: "awaiting_method" },
];

export const contributorStatusToPill = (s: ContributorStatus) =>
  s === "paid" ? ("paid" as const) : s === "authorized" ? ("authorized" as const) : s === "viewed" ? ("viewed" as const) : s === "failed" ? ("failed" as const) : s === "expired" ? ("expired" as const) : ("invited" as const);
