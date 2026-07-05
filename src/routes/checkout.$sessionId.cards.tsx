// S07 Multi-Card Setup
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, X, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { StepHeader } from "@/components/step-header";
import { AmountDisplay } from "@/components/amount-display";
import { demoSession } from "@/lib/demo-session";
import { formatMoney } from "@/lib/format";
import { spring } from "@/lib/motion";

export const Route = createFileRoute("/checkout/$sessionId/cards")({
  head: () => ({
    meta: [
      { title: "Multi-Card Split — ZakaPay" },
      { name: "description", content: "Split this checkout across multiple cards." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MultiCardSetup,
});

interface Alloc { id: string; label: string; last4: string; amountCents: number }

function MultiCardSetup() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/cards" });
  const navigate = useNavigate();
  const total = demoSession.totalCents;
  const [allocs, setAllocs] = useState<Alloc[]>([
    { id: "c1", label: "Debit ending", last4: "4321", amountCents: Math.floor(total / 2) },
    { id: "c2", label: "Credit ending", last4: "8890", amountCents: total - Math.floor(total / 2) },
  ]);

  const allocated = useMemo(() => allocs.reduce((a, b) => a + b.amountCents, 0), [allocs]);
  const remaining = total - allocated;
  const valid = remaining === 0 && allocs.length >= 2 && allocs.every((a) => a.amountCents > 0 && a.last4.length === 4);

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
            eyebrow="Multi-Card Split"
            title="Distribute across your cards"
            description="Add at least two cards. Charges are authorized sequentially and captured atomically."
          />
          <div className="flex items-end gap-6">
            <AmountDisplay amountCents={total} size="md" label="Total" />
            <AmountDisplay amountCents={remaining} size="md" label="Remaining" tone={remaining === 0 ? "success" : "muted"} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {allocs.map((a, idx) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={spring}
                className="grid grid-cols-1 items-center gap-2 rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur-md md:grid-cols-[auto_1fr_120px_150px_auto]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <CreditCard className="h-4 w-4" />
                </div>
                <input
                  aria-label="Card label"
                  value={a.label}
                  onChange={(e) => setAllocs((v) => v.map((x) => (x.id === a.id ? { ...x, label: e.target.value } : x)))}
                  placeholder="Card label"
                  className="rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <input
                  aria-label="Last 4 digits"
                  value={a.last4}
                  maxLength={4}
                  inputMode="numeric"
                  onChange={(e) => setAllocs((v) => v.map((x) => (x.id === a.id ? { ...x, last4: e.target.value.replace(/\D/g, "") } : x)))}
                  placeholder="Last 4"
                  className="tabular rounded-xl bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <input
                  aria-label="Amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={(a.amountCents / 100).toFixed(2)}
                  onChange={(e) => setAllocs((v) => v.map((x) => (x.id === a.id ? { ...x, amountCents: Math.max(0, Math.round(parseFloat(e.target.value || "0") * 100)) } : x)))}
                  className="tabular rounded-xl bg-transparent px-3 py-2 text-right text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setAllocs((v) => v.filter((x) => x.id !== a.id))}
                  aria-label="Remove card"
                  disabled={allocs.length <= 2}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setAllocs((v) => [
                  ...v,
                  { id: `c${Date.now()}`, label: "Card ending", last4: "", amountCents: Math.max(remaining, 0) },
                ])
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md transition-colors hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add card
            </button>
            {remaining !== 0 && (
              <span className="text-xs text-muted-foreground">
                {remaining > 0 ? `${formatMoney(remaining)} to allocate.` : `Over by ${formatMoney(Math.abs(remaining))}.`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link to="/checkout/$sessionId" params={{ sessionId }} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Back
          </Link>
          <button
            type="button"
            disabled={!valid}
            onClick={() => navigate({ to: "/checkout/$sessionId/processing", params: { sessionId } })}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform active:scale-[0.97] disabled:opacity-40"
          >
            Authorize cards
          </button>
        </div>
      </GlassCard>
    </CheckoutShell>
  );
}
