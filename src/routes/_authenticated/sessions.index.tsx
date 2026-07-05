import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { GlassCard } from "@/components/glass-card";
import { PaymentStatusPill } from "@/components/payment-status-pill";
import { formatMoney } from "@/lib/format";
import { demoSessions } from "@/lib/demo-dashboard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sessions/")({
  head: () => ({
    meta: [
      { title: "Sessions — ZakaPay" },
      { name: "description", content: "All split sessions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SessionsList,
});

const filters = ["All", "Collecting", "Completed", "Expired", "Failed"] as const;

function SessionsList() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [q, setQ] = useState("");

  const rows = demoSessions.filter((s) => {
    if (filter !== "All" && s.status !== filter.toLowerCase()) return false;
    if (q && !`${s.reference} ${s.buyer}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">Sessions</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">All split sessions</h1>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f ? "border-foreground bg-foreground text-background" : "border-border bg-white/70 backdrop-blur-md hover:bg-white",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1.5 backdrop-blur-md">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search reference or buyer"
              className="bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <GlassCard padding="none" className="overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_1fr_120px_140px_120px] items-center gap-4 border-b border-border/60 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Reference</span>
            <span>Method</span>
            <span>Buyer</span>
            <span className="text-right">Amount</span>
            <span>Status</span>
            <span className="text-right">Created</span>
          </div>
          <div className="divide-y divide-border/40">
            {rows.map((s) => (
              <Link
                key={s.id}
                to="/sessions/$id"
                params={{ id: s.id }}
                className="grid grid-cols-[1fr_120px_1fr_120px_140px_120px] items-center gap-4 px-6 py-4 text-sm transition-colors hover:bg-white/40"
              >
                <span className="font-medium">{s.reference}</span>
                <span className="text-xs text-muted-foreground">{s.method === "contributor" ? "Contributor" : "Multi-card"}</span>
                <span className="text-muted-foreground">{s.buyer}</span>
                <span className="tabular text-right font-semibold">{formatMoney(s.totalCents, s.currency)}</span>
                <PaymentStatusPill status={s.status === "collecting" ? "processing" : s.status === "completed" ? "completed" : s.status === "failed" ? "failed" : "expired"} />
                <span className="text-right text-xs text-muted-foreground">{s.createdAt}</span>
              </Link>
            ))}
            {rows.length === 0 && (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">No sessions match your filters.</div>
            )}
          </div>
        </GlassCard>
      </div>
    </DashboardShell>
  );
}
