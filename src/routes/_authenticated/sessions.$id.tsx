import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, RefreshCcw } from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { GlassCard } from "@/components/glass-card";
import { AmountDisplay } from "@/components/amount-display";
import { ContributorRow } from "@/components/contributor-row";
import { PaymentStatusPill } from "@/components/payment-status-pill";
import { demoSessions, demoAudit } from "@/lib/demo-dashboard";
import { demoSession } from "@/lib/demo-session";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sessions/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Session ${params.id} — ZakaPay` },
      { name: "description", content: "Split session detail." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SessionDetail,
  notFoundComponent: () => (
    <DashboardShell>
      <div className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-2xl font-semibold">Session not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may have expired or been removed.</p>
        <Link to="/sessions" className="mt-4 inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline">
          Back to sessions
        </Link>
      </div>
    </DashboardShell>
  ),
});

function SessionDetail() {
  const { id } = useParams({ from: "/_authenticated/sessions/$id" });
  const session = demoSessions.find((s) => s.id === id);
  if (!session) throw notFound();

  const [refunding, setRefunding] = useState(false);
  function refund() {
    setRefunding(true);
    setTimeout(() => {
      setRefunding(false);
      toast.success("Refund initiated. Contributors will be notified.");
    }, 900);
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Link to="/sessions" className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sessions
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">
              {session.method === "contributor" ? "Contributor Split" : "Multi-Card Split"}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Session {session.reference}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Buyer: {session.buyer} · {session.createdAt}</p>
          </div>
          <div className="flex items-center gap-2">
            <PaymentStatusPill status={session.status === "collecting" ? "processing" : session.status === "completed" ? "completed" : session.status === "failed" ? "failed" : "expired"} />
            {session.status === "completed" && (
              <button
                onClick={refund}
                disabled={refunding}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md hover:bg-white disabled:opacity-60"
              >
                <RefreshCcw className={refunding ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /> Issue refund
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-4">
            <GlassCard padding="lg" className="flex items-center justify-between">
              <AmountDisplay amountCents={session.totalCents} size="xl" label="Order total" currency={session.currency} />
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Method</p>
                <p className="mt-1 text-sm font-medium">
                  {session.method === "contributor" ? `${session.contributorCount} contributors` : "Multi-card"}
                </p>
              </div>
            </GlassCard>

            <GlassCard padding="lg">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contributors</h2>
              <div className="flex flex-col gap-2">
                {demoSession.contributors.slice(0, session.contributorCount || 1).map((c) => (
                  <ContributorRow
                    key={c.id}
                    name={c.name}
                    email={c.email}
                    amountCents={c.shareCents}
                    status={c.status === "paid" ? "paid" : c.status === "authorized" ? "authorized" : c.status === "viewed" ? "viewed" : "invited"}
                    isInitiator={c.isInitiator}
                  />
                ))}
              </div>
            </GlassCard>

            <GlassCard padding="lg">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Payments</h2>
              <div className="flex flex-col gap-2 text-sm">
                {demoSession.contributors.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-white/60 p-3">
                    <div>
                      <p className="font-medium">Payment · {c.name}</p>
                      <p className="text-xs text-muted-foreground">pi_demo_{c.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular text-sm font-semibold">{formatMoney(c.shareCents)}</span>
                      <PaymentStatusPill status={c.status === "paid" ? "captured" : c.status === "authorized" ? "authorized" : "pending"} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <GlassCard padding="lg">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Audit timeline</h2>
            <ol className="flex flex-col gap-3">
              {demoAudit.map((a) => (
                <li key={a.id} className="grid grid-cols-[auto_1fr] gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[color:var(--primary)]" />
                  <div>
                    <p className="text-sm font-medium">{a.eventType}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.at}
                      {a.from && ` · ${a.from} → ${a.to}`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </GlassCard>
        </div>
      </div>
    </DashboardShell>
  );
}
