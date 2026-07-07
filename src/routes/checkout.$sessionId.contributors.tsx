// S02 — Contributor Setup (per tx). All fields required, Split Evenly, host locked.
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { AmountDisplay } from "@/components/amount-display";
import { CartSummary } from "@/components/cart-summary";
import { txStore, useTransaction, type TxContributor } from "@/lib/tx-store";
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
  useEffect(() => { txStore.ensure(sessionId, "contributor"); }, [sessionId]);
  const tx = useTransaction(sessionId);
  const total = tx?.totalCents ?? 0;

  const [rows, setRows] = useState<Draft[]>(() => {
    if (tx?.contributors && tx.contributors.length > 0) {
      return tx.contributors.map((c) => ({ id: c.id, name: c.name, email: c.email, shareCents: c.shareCents, isInitiator: c.isInitiator }));
    }
    const per = Math.floor(total / 3);
    return [
      { id: "host", name: "You (Host)", email: "you@example.com", shareCents: per, isInitiator: true },
      { id: "d1", name: "", email: "", shareCents: per },
      { id: "d2", name: "", email: "", shareCents: total - 2 * per },
    ];
  });

  const allocated = useMemo(() => rows.reduce((a, b) => a + b.shareCents, 0), [rows]);
  const remaining = total - allocated;
  const balanced = remaining === 0;
  const allValid = rows.every((r) => r.name.trim() && r.email.trim() && r.shareCents > 0);
  const canSend = balanced && allValid && rows.length >= 2;

  function update(id: string, patch: Partial<Draft>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function add() {
    setRows((rs) => [...rs, { id: `d${Date.now()}`, name: "", email: "", shareCents: Math.max(remaining, 0) }]);
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
  function splitEvenly() {
    const n = rows.length;
    if (n === 0) return;
    const per = Math.floor(total / n);
    const rest = total - per * n;
    setRows((rs) => rs.map((r, i) => ({ ...r, shareCents: per + (i === 0 ? rest : 0) })));
  }

  function submit() {
    if (!canSend) return;
    const contribs: TxContributor[] = rows.map((r) => ({
      id: r.id,
      name: r.name.trim(),
      email: r.email.trim(),
      shareCents: r.shareCents,
      isInitiator: r.isInitiator,
      status: "pending",
      delivery: r.isInitiator ? "read" : "sent",
      allocations: [],
    }));
    txStore.setContributors(sessionId, contribs);
    navigate({ to: "/checkout/$sessionId/invited", params: { sessionId } });
  }

  return (
    <CheckoutShell
      merchantName={tx?.merchantName ?? ""}
      merchantInitial={tx?.merchantInitial ?? ""}
      orderReference={tx?.orderReference}
      step={1}
      showClose
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-secondary/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Add contributors
          </span>
        </div>

        <CartSummary items={tx?.items ?? []} subtotalCents={tx?.subtotalCents ?? 0} vatCents={tx?.vatCents ?? 0} totalCents={total} />

        <GlassCard variant="strong" padding="lg" className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4">
            <AmountDisplay amountCents={total} size="md" label="Total" />
            <AmountDisplay amountCents={remaining} size="md" label="Remaining" tone={balanced ? "success" : remaining < 0 ? "default" : "muted"} />
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
                  <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[1.1fr_1fr_160px_auto]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {r.isInitiator ? "Host / You" : "Contributor"}
                      </span>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-muted-foreground">Full name</span>
                        <input
                          aria-label="Contributor name"
                          required
                          value={r.name}
                          onChange={(e) => update(r.id, { name: e.target.value })}
                          placeholder="Full name (required)"
                          className={cn(
                            "rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            r.isInitiator && "font-semibold text-foreground",
                          )}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-muted-foreground">Email address</span>
                        <input
                          aria-label="Contributor email"
                          required
                          value={r.email}
                          onChange={(e) => update(r.id, { email: e.target.value })}
                          placeholder="email@example.com (required)"
                          type="email"
                          className="rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </label>
                    </div>
                    <div className="flex items-center gap-1 rounded-xl bg-white/70 px-2 ring-1 ring-border/60">
                      <span className="text-xs text-muted-foreground">$</span>
                      <input
                        aria-label="Share amount"
                        type="text"
                        inputMode="decimal"
                        value={((r.shareCents ?? 0) / 100).toFixed(2)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const parsed = raw === "" ? 0 : Number.parseFloat(raw);
                          update(r.id, { shareCents: Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0 });
                        }}
                        className="tabular flex-1 bg-transparent px-1 py-2 text-right text-sm outline-none"
                      />
                    </div>
                    {r.isInitiator ? (
                      <span className="rounded-full bg-[color:var(--primary)]/10 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[color:var(--primary)]">Host</span>
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
              <button
                type="button"
                onClick={splitEvenly}
                className="text-xs font-semibold uppercase tracking-wider text-[color:var(--primary)] hover:underline underline-offset-4"
              >
                Split evenly
              </button>
              {!balanced && (
                <span className="text-xs text-muted-foreground">
                  {remaining > 0 ? `${formatMoney(remaining)} still to allocate.` : `Over by ${formatMoney(Math.abs(remaining))}.`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link to="/checkout/$sessionId" params={{ sessionId }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <button
              type="button"
              disabled={!canSend}
              onClick={submit}
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
