// S08 Processing — sequentially animate each allocated method, then route by tx kind.
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { ProcessingCard } from "@/components/processing-card";
import { AmountDisplay } from "@/components/amount-display";
import { txStore, useTransaction, type TxAllocation, type TxMethod } from "@/lib/tx-store";

export const Route = createFileRoute("/checkout/$sessionId/processing")({
  head: () => ({
    meta: [
      { title: "Processing — ZakaPay" },
      { name: "description", content: "Authorizing your payment methods." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Processing,
});

const PER_STEP_MS = 1600;
const FINAL_WAIT_MS = 5000;

function Processing() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/processing" });
  const navigate = useNavigate();
  const tx = useTransaction(sessionId);
  const [idx, setIdx] = useState(0);

  const items = useMemo(() => {
    if (!tx) return [] as { method: TxMethod; amountCents: number }[];
    return tx.hostAllocations
      .map((a: TxAllocation) => {
        const method = tx.methods.find((m) => m.id === a.methodId);
        return method ? { method, amountCents: a.amountCents } : null;
      })
      .filter(Boolean) as { method: TxMethod; amountCents: number }[];
  }, [tx]);

  const shareTotal = items.reduce((a, b) => a + b.amountCents, 0);
  const total = tx?.totalCents ?? 0;
  const stripeFired = useRef(false);

  // Create real Stripe PaymentIntent when processing starts (once per session)
  useEffect(() => {
    if (!tx || items.length === 0 || idx !== 0 || stripeFired.current) return;
    stripeFired.current = true;
    const totalAmount = tx.kind === "multi_card" ? tx.totalCents : shareTotal;
    import("@/lib/convex-actions")
      .then(({ createStripePaymentIntent }) =>
        createStripePaymentIntent({
          amountCents: totalAmount,
          sessionId,
          description: `ZakaPay split — ${tx.merchantName} — ${sessionId}`,
        }),
      )
      .then((result) => {
        if (result?.success) {
          console.log(`[stripe] PaymentIntent ${result.mock ? "(mock) " : ""}created:`, result.paymentIntentId);
        }
      })
      .catch(() => {});
  }, [tx, items.length, idx, sessionId, shareTotal]);

  useEffect(() => {
    if (!tx || items.length === 0) return;
    if (idx < items.length) {
      const t = setTimeout(() => setIdx((i) => i + 1), PER_STEP_MS);
      return () => clearTimeout(t);
    }
    // All done. Wait, then route by tx.kind.
    const t = setTimeout(() => {
      // Mark initiator paid if contributor kind
      if (tx.kind === "contributor") {
        const host = tx.contributors.find((c) => c.isInitiator);
        if (host) txStore.patchContributor(sessionId, host.id, { status: "paid", allocations: tx.hostAllocations });
        const latest = txStore.get(sessionId);
        const allPaid = latest?.contributors.every((c) => c.status === "paid");
        navigate({
          to: allPaid ? "/checkout/$sessionId/complete" : "/checkout/$sessionId/status",
          params: { sessionId },
        });
      } else {
        navigate({ to: "/checkout/$sessionId/complete", params: { sessionId } });
      }
    }, FINAL_WAIT_MS);
    return () => clearTimeout(t);
  }, [idx, items.length, tx, sessionId, navigate]);

  const current = items[Math.min(idx, items.length - 1)];

  return (
    <CheckoutShell
      merchantName={tx?.merchantName ?? ""}
      merchantInitial={tx?.merchantInitial ?? ""}
      orderReference={tx?.orderReference}
      showStepBar={false}
    >
      <GlassCard variant="strong" padding="lg" className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">
            {tx?.kind === "multi_card" ? "Processing methods" : "Processing your share"}
          </span>

        </div>

        <div className="flex flex-col items-center gap-2">
          <AmountDisplay amountCents={tx?.kind === "multi_card" ? total : shareTotal} size="lg" tone="muted" label={tx?.kind === "multi_card" ? "Order total" : "Your share"} />
          <p className="text-xs text-muted-foreground">
            {idx < items.length ? `Method ${idx + 1} of ${items.length}` : "Finalizing…"}
          </p>
        </div>

        {current && (
          <ProcessingCard
            key={current.method.id}
            method={current.method}
            amountCents={current.amountCents}
            state={idx < items.length ? "active" : "done"}
          />
        )}

        <ol className="flex flex-col gap-1.5">
          {items.map((it, i) => {
            const state = i < idx ? "done" : i === idx ? "active" : "pending";
            return (
              <li
                key={it.method.id}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
                  state === "done" ? "bg-[color:var(--success)]/10 text-[color:var(--success)]"
                  : state === "active" ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)]"
                  : "bg-secondary/60 text-muted-foreground"
                }`}
              >
                <span className="font-medium">{it.method.label}</span>
                <span className="tabular">${(it.amountCents / 100).toFixed(2)} · {state}</span>
              </li>
            );
          })}
        </ol>
      </GlassCard>
    </CheckoutShell>
  );
}
