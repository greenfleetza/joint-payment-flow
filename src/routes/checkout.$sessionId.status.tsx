// S06 Contributor Status — live progress
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { StepHeader } from "@/components/step-header";
import { ContributorRow } from "@/components/contributor-row";
import { ProgressRing } from "@/components/progress-ring";
import { demoSession, type DemoContributor } from "@/lib/demo-session";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/checkout/$sessionId/status")({
  head: () => ({
    meta: [
      { title: "Split progress — ZakaPay" },
      { name: "description", content: "Live progress for your contributor split checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatusScreen,
});

function StatusScreen() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/status" });
  const navigate = useNavigate();
  const total = demoSession.totalCents;

  // Simulate remaining contributors paying over time (demo only).
  const [contribs, setContribs] = useState<DemoContributor[]>(() =>
    demoSession.contributors.map((c) => ({ ...c, status: c.isInitiator ? "authorized" : c.status })),
  );

  useEffect(() => {
    const pending = contribs.filter((c) => c.status !== "paid" && c.status !== "authorized");
    if (pending.length === 0) return;
    const t = setTimeout(() => {
      setContribs((cs) => {
        const idx = cs.findIndex((c) => c.status !== "paid" && c.status !== "authorized");
        if (idx === -1) return cs;
        const next = [...cs];
        next[idx] = { ...next[idx], status: "paid" };
        return next;
      });
    }, 2200);
    return () => clearTimeout(t);
  }, [contribs]);

  const paidCents = useMemo(
    () => contribs.filter((c) => c.status === "paid" || c.status === "authorized").reduce((a, c) => a + c.shareCents, 0),
    [contribs],
  );
  const allDone = contribs.every((c) => c.status === "paid" || c.status === "authorized");

  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => navigate({ to: "/checkout/$sessionId/complete", params: { sessionId } }), 1400);
      return () => clearTimeout(t);
    }
  }, [allDone, navigate, sessionId]);

  return (
    <CheckoutShell
      merchantName={demoSession.merchantName}
      merchantInitial={demoSession.merchantLogoInitial}
      orderReference={demoSession.orderReference}
      step={3}
    >
      <GlassCard variant="strong" padding="lg" className="flex flex-col gap-8">
        <StepHeader
          eyebrow={allDone ? "Ready to complete" : "Waiting on contributors"}
          title="Live split progress"
          description="We'll capture the full amount as soon as everyone has paid. You'll be notified either way."
        />

        <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-around">
          <ProgressRing
            value={paidCents / total}
            label={
              <motion.span
                key={paidCents}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="tabular"
              >
                {Math.round((paidCents / total) * 100)}%
              </motion.span>
            }
            sublabel="Collected"
          />
          <div className="flex flex-col gap-1 text-center md:text-left">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Order total</p>
            <p className="tabular text-3xl font-semibold tracking-tight">{formatMoney(total)}</p>
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Remaining</p>
            <p className="tabular text-lg font-medium text-muted-foreground">{formatMoney(total - paidCents)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {contribs.map((c) => (
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

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Session {sessionId}</span>
          <Link to="/" className="underline-offset-4 hover:underline">
            Leave — we'll email you
          </Link>
        </div>
      </GlassCard>
    </CheckoutShell>
  );
}
