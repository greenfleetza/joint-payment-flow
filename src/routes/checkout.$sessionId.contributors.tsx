// S02 — Contributor Setup
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { AmountDisplay } from "@/components/amount-display";
import { CartSummary } from "@/components/cart-summary";
import { demoSession } from "@/lib/demo-session";
import { formatMoney } from "@/lib/format";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

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

interface Draft { id: string; name: string; email: string; shareCents: number; isInitiator?: boolean }

function ContributorSetup() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/contributors" });
  const navigate = useNavigate();
  const total = demoSession.totalCents;
  const [rows, setRows] = useState<Draft[]>([
    { id: "host", name: "You (Host)", email: "you@example.com", shareCents: Math.floor(total / 3), isInitiator: true },
    { id: "d1", name: "", email: "", shareCents: Math.floor(total / 3) },
    { id: "d2", name: "", email: "", shareCents: total - 2 * Math.floor(total / 3) },
  ]);

  const allocated = useMemo(() => rows.reduce((a, b) => a + b.shareCents, 0), [rows]);
  const remaining = total - allocated;
  const balanced = remaining === 0;
  const guestsValid = rows.filter((r) => !r.isInitiator).every((r) => r.name.trim() && r.email.trim() && r.shareCents > 0);
  const canSend = balanced && guestsValid && rows.length >= 2;

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
  function fillRemaining(id: string) {
    setRows((rs) => {
      const other = rs.filter((r) => r.id !== id).reduce((a, b) => a + b.shareCents, 0);
      return rs.map((r) => (r.id === id ? { ...r, shareCents: Math.max(0, total - other) } : r));
    });
  }

  return (
    <CheckoutShell
      merchantName={demoSession.merchantName}
      merchantInitial={demoSession.merchantLogoInitial}
      orderReference={demoSession.orderReference}
      step={1}
      showClose
    >
      <div className="flex flex-col gap-5">
        <CartSummary
          items={demoSession.items}
          subtotalCents={demoSession.subtotalCents}
          vatCents={demoSession.vatCents}
          totalCents={demoSession.totalCents}
        />

        <GlassCard variant="strong" padding="lg" className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4">
            <AmountDisplay amountCents={total} size="md" label="Total" />
            <AmountDisplay
              amountCents={remaining}
              size="md"
              label="Remaining"
              tone={balanced ? "success" : remaining < 0 ? "default" : "muted"}
            />
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
                  className={cn(
                    "rounded-2xl border p-3 backdrop-blur-md",
                    r.isInitiator ? "border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5" : "border-border/60 bg-card/70",
                  )}
                >
                  <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[1fr_1fr_160px_auto]">
                    <input
                      aria-label="Contributor name"
                      value={r.name}
                      readOnly={r.isInitiator}
                      onChange={(e) => update(r.id, { name: e.target.value })}
                      placeholder="Full name"
                      className={cn(
                        "rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        r.isInitiator && "font-semibold text-foreground",
                      )}
                    />
                    <input
                      aria-label="Contributor email"
                      value={r.email}
                      readOnly={r.isInitiator}
                      onChange={(e) => update(r.id, { email: e.target.value })}
                      placeholder="email@example.com"
                      type="email"
                      className="rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <div className="flex items-center gap-1 rounded-xl bg-white/70 px-2 ring-1 ring-border/60">
                      <span className="text-xs text-muted-foreground">$</span>
                      <input
                        aria-label="Share amount"
                        type="number"
                        min={0}
                        step="0.01"
                        value={(r.shareCents / 100).toFixed(2)}
                        onChange={(e) => update(r.id, { shareCents: Math.max(0, Math.round(parseFloat(e.target.value || "0") * 100)) })}
                        className="tabular flex-1 bg-transparent px-1 py-2 text-right text-sm outline-none"
                      />
                    </div>
                    {r.isInitiator ? (
                      <span className="rounded-full bg-[color:var(--primary)]/10 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[color:var(--primary)]">
                        Host
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => remove(r.id)}
                        aria-label="Remove contributor"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => fillRemaining(r.id)}
                      disabled={remaining === 0}
                      className="text-[11px] font-medium text-[color:var(--primary)] hover:underline underline-offset-4 disabled:text-muted-foreground disabled:no-underline"
                    >
                      Fill remaining
                    </button>
                  </div>
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
              {!balanced && (
                <span className="text-xs text-muted-foreground">
                  {remaining > 0
                    ? `${formatMoney(remaining)} still to allocate.`
                    : `Over by ${formatMoney(Math.abs(remaining))}.`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/checkout/$sessionId"
              params={{ sessionId }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <button
              type="button"
              disabled={!canSend}
              onClick={() => navigate({ to: "/checkout/$sessionId/invited", params: { sessionId } })}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
            >
              Send invitations
            </button>
          </div>
        </GlassCard>
      </div>
    </CheckoutShell>
  );
}
