// S09 Thread Completed — celebratory success screen for both contributor & multi-card tx.
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { CheckCircle2, Download, Printer } from "lucide-react";
import { motion } from "framer-motion";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { CartSummary } from "@/components/cart-summary";
import { CelebrationBurst } from "@/components/celebration-burst";
import { AmountDisplay } from "@/components/amount-display";
import { useTransaction } from "@/lib/tx-store";
import { formatMoney, initials } from "@/lib/format";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout/$sessionId/complete")({
  head: () => ({
    meta: [
      { title: "Payment complete — ZakaPay" },
      { name: "description", content: "The order is paid in full." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Complete,
});

function Complete() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/complete" });
  const navigate = useNavigate();
  const tx = useTransaction(sessionId);
  if (!tx) return null;

  const isMulti = tx.kind === "multi_card";
  const paidCount = tx.contributors.filter((c) => c.status === "paid").length;
  const totalCount = tx.contributors.length;

  return (
    <CheckoutShell
      merchantName={tx.merchantName}
      merchantInitial={tx.merchantInitial}
      orderReference={tx.orderReference}
      showStepBar={false}
      showClose
    >
      <div className="flex flex-col gap-5">
        <GlassCard variant="strong" padding="lg" className="relative flex flex-col items-center gap-4 overflow-hidden text-center">
          <CelebrationBurst />
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring}
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)]"
          >
            <CheckCircle2 className="h-8 w-8" />
          </motion.span>
          <div className="relative flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--success)]">
              {isMulti ? "Multi-card thread completed" : "Contributor thread completed"}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">You're all set</h1>
            <p className="text-sm text-muted-foreground">
              Tx {sessionId} · {tx.merchantName} received a single successful payment.
            </p>
          </div>
          <AmountDisplay amountCents={tx.totalCents - tx.promoDiscountCents} size="xl" tone="success" label="Order paid" />

          {!isMulti && (
            <div className="relative w-full max-w-xs">
              <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Contributors paid</span>
                <span className="tabular font-semibold">{paidCount} / {totalCount}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalCount ? (paidCount / totalCount) * 100 : 100}%` }}
                  transition={spring}
                  className="h-full rounded-full bg-[color:var(--success)]"
                />
              </div>
            </div>
          )}
        </GlassCard>

        <CartSummary items={tx.items} subtotalCents={tx.subtotalCents} vatCents={tx.vatCents} totalCents={tx.totalCents} defaultOpen showCoupon={false} />

        {isMulti ? (
          <MultiCardBreakdown tx={tx} />
        ) : (
          <ContributorBreakdown tx={tx} />
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium backdrop-blur-md hover:bg-white"
          >
            <Printer className="h-4 w-4" /> View receipt
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
          >
            <Download className="h-4 w-4" /> Download receipt
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center rounded-full bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white"
          >
            Done
          </button>
        </div>
      </div>
    </CheckoutShell>
  );
}

function ContributorBreakdown({ tx }: { tx: NonNullable<ReturnType<typeof useTransaction>> }) {
  return (
    <GlassCard variant="strong" padding="lg" className="flex flex-col gap-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">Contributors</p>
      <ul className="flex flex-col gap-2">
        {tx.contributors.map((c) => (
          <li key={c.id} className={cn("rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur-md")}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--info)] text-xs font-semibold text-white">
                {initials(c.name || c.email)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}{c.isInitiator && " (Host)"}</p>
                <p className="truncate text-xs text-muted-foreground">{c.email}</p>
              </div>
              <span className="tabular text-sm font-semibold">{formatMoney(c.shareCents)}</span>
            </div>
            {c.allocations.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 border-t border-border/60 pt-2">
                {c.allocations.map((a) => {
                  const m = tx.methods.find((mm) => mm.id === a.methodId);
                  return (
                    <li key={a.methodId} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{m?.label ?? "Method"}</span>
                      <span className="tabular font-medium">{formatMoney(a.amountCents)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

function MultiCardBreakdown({ tx }: { tx: NonNullable<ReturnType<typeof useTransaction>> }) {
  return (
    <GlassCard variant="strong" padding="lg" className="flex flex-col gap-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">Payment methods used</p>
      <ul className="flex flex-col gap-2">
        {tx.hostAllocations.map((a) => {
          const m = tx.methods.find((mm) => mm.id === a.methodId);
          return (
            <li key={a.methodId} className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur-md">
              <span className="text-sm font-medium">{m?.label ?? "Method"}</span>
              <span className="tabular text-sm font-semibold">{formatMoney(a.amountCents)}</span>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
