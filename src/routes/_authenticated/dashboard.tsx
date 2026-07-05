import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp, Users, RefreshCcw } from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { GlassCard } from "@/components/glass-card";
import { AmountDisplay } from "@/components/amount-display";
import { PaymentStatusPill } from "@/components/payment-status-pill";
import { formatMoney, formatPercent } from "@/lib/format";
import { demoSessions } from "@/lib/demo-dashboard";
import { fadeUp, stagger } from "@/lib/motion";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — ZakaPay" },
      { name: "description", content: "Merchant overview: volume, sessions, refund rate." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Overview,
});

const stats = [
  { label: "Payment volume", value: "$18,940", delta: "+12.4%", icon: TrendingUp },
  { label: "Sessions this week", value: "48", delta: "+9", icon: Users },
  { label: "Success rate", value: "96.2%", delta: "+1.1%", icon: TrendingUp },
  { label: "Refund rate", value: "1.8%", delta: "-0.4%", icon: RefreshCcw },
];

function Overview() {
  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">Overview</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Good to see you again.</h1>
            <p className="mt-1 text-sm text-muted-foreground">Here's how ZakaPay is performing today.</p>
          </div>
          <Link to="/sessions" className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
            View all sessions <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <motion.div variants={stagger(0.05)} initial="hidden" animate="visible" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} variants={fadeUp}>
                <GlassCard padding="md" className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="tabular text-3xl font-semibold tracking-tight">{s.value}</p>
                  <p className="text-xs text-[color:var(--success)]">{s.delta}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>

        <GlassCard padding="lg" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Recent sessions</h2>
            <Link to="/sessions" className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">See all</Link>
          </div>
          <div className="divide-y divide-border/60">
            {demoSessions.slice(0, 5).map((s) => (
              <Link
                key={s.id}
                to="/sessions/$id"
                params={{ id: s.id }}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-3 transition-colors hover:bg-white/40 md:grid-cols-[1fr_1fr_auto_auto]"
              >
                <div>
                  <p className="text-sm font-medium">{s.reference}</p>
                  <p className="text-xs text-muted-foreground">{s.buyer} · {s.createdAt}</p>
                </div>
                <p className="hidden text-xs text-muted-foreground md:block">
                  {s.method === "contributor" ? `${s.contributorCount} contributors` : "Multi-card"}
                </p>
                <span className="tabular text-sm font-semibold">{formatMoney(s.totalCents, s.currency)}</span>
                <PaymentStatusPill status={s.status === "collecting" ? "processing" : s.status === "completed" ? "completed" : s.status === "failed" ? "failed" : "expired"} />
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>
    </DashboardShell>
  );
}
