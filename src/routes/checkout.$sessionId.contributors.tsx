// S02 — Contributor Setup
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { StepHeader } from "@/components/step-header";
import { AmountDisplay } from "@/components/amount-display";
import { demoSession } from "@/lib/demo-session";
import { formatMoney } from "@/lib/format";
import { spring } from "@/lib/motion";

export const Route = createFileRoute("/checkout/$sessionId/contributors")({
  head: () => ({
    meta: [
      { title: "Add contributors — ZakaPay" },
      { name: "description", content: "Invite contributors to help pay for this order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContributorSetup,
});

interface Draft { id: string; name: string; email: string; shareCents: number }

function ContributorSetup() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/contributors" });
  const total = demoSession.totalCents;
  const [rows, setRows] = useState<Draft[]>([
    { id: "you", name: "You", email: "you@example.com", shareCents: Math.floor(total / 3) },
    { id: "d1", name: "", email: "", shareCents: Math.floor(total / 3) },
    { id: "d2", name: "", email: "", shareCents: total - 2 * Math.floor(total / 3) },
  ]);

  const allocated = useMemo(() => rows.reduce((a, b) => a + b.shareCents, 0), [rows]);
  const remaining = total - allocated;
  const balanced = remaining === 0;
  const validRows = rows.every((r) => r.name && r.email && r.shareCents > 0);

  function update(id: string, patch: Partial<Draft>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function add() {
    setRows((rs) => [
      ...rs,
      { id: `d${Date.now()}`, name: "", email: "", shareCents: Math.max(remaining, 0) },
    ]);
  }
  function remove(id: string) {
    setRows((rs) => rs.filter((r) => r.id !== id));
  }
  function split() {
    const per = Math.floor(total / rows.length);
    const rest = total - per * rows.length;
    setRows((rs) => rs.map((r, i) => ({ ...r, shareCents: per + (i === 0 ? rest : 0) })));
  }

  return (
    <CheckoutShell
      merchantName={demoSession.merchantName}
      merchantInitial={demoSession.merchantLogoInitial}
      orderReference={demoSession.orderReference}
      step={2}
    >
      <GlassCard variant="strong" padding="lg" className="flex flex-col gap-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <StepHeader
            eyebrow="Step 2 of 3"
            title="Who's chipping in?"
            description="Add contributors and set their share. Everyone receives a secure link to pay."
          />
          <div className="flex items-end gap-6">
            <AmountDisplay amountCents={total} size="md" label="Total" />
            <AmountDisplay
              amountCents={remaining}
              size="md"
              label="Remaining"
              tone={balanced ? "success" : remaining < 0 ? "default" : "muted"}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={spring}
                className="grid grid-cols-1 items-center gap-2 rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur-md md:grid-cols-[1fr_1fr_150px_auto]"
              >
                <input
                  aria-label="Contributor name"
                  value={r.name}
                  onChange={(e) => update(r.id, { name: e.target.value })}
                  placeholder="Full name"
                  className="rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <input
                  aria-label="Contributor email"
                  value={r.email}
                  onChange={(e) => update(r.id, { email: e.target.value })}
                  placeholder="email@example.com"
                  type="email"
                  className="rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <input
                  aria-label="Share amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={(r.shareCents / 100).toFixed(2)}
                  onChange={(e) => update(r.id, { shareCents: Math.max(0, Math.round(parseFloat(e.target.value || "0") * 100)) })}
                  className="tabular rounded-xl bg-transparent px-3 py-2 text-right text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  aria-label="Remove contributor"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={add}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md transition-colors hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add contributor
            </button>
            <button
              type="button"
              onClick={split}
              className="rounded-full border border-border bg-white/70 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md transition-colors hover:bg-white"
            >
              Split evenly
            </button>
            {!balanced && (
              <span className="text-xs text-muted-foreground">
                {remaining > 0
                  ? `${formatMoney(remaining)} still needs to be allocated.`
                  : `Allocations exceed the total by ${formatMoney(Math.abs(remaining))}.`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link
            to="/checkout/$sessionId"
            params={{ sessionId }}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back
          </Link>
          <Link
            to="/checkout/$sessionId/invited"
            params={{ sessionId }}
            aria-disabled={!balanced || !validRows}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform active:scale-[0.97] aria-disabled:pointer-events-none aria-disabled:opacity-40"
          >
            Send invitations
          </Link>
        </div>
      </GlassCard>
    </CheckoutShell>
  );
}
