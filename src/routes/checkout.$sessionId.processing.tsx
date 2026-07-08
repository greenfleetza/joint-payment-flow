// S08 Processing — animates each allocated method sequentially, handles per-method
// failure with Retry / Replace, and routes on success. Failures navigate to /failed.
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCw, Replace } from "lucide-react";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { ProcessingCard } from "@/components/processing-card";
import { PaymentMethodSheet } from "@/components/payment-method-sheet";
import { AmountDisplay } from "@/components/amount-display";
import { txStore, useTransaction, type TxAllocation, type TxMethod } from "@/lib/tx-store";
import { getCorrelationId, newActionId } from "@/lib/correlation-id";
import { emit } from "@/lib/domain-events";
import { checkRateLimit } from "@/lib/rate-limit";
import { toast } from "sonner";

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
const FINAL_WAIT_MS = 3500;

// Small deterministic hash → 0..1 based on method id + attempt. Lets us "fail"
// specific test method IDs in a demo way without random flakiness.
function pseudoFailChance(methodId: string, attempt: number): number {
  // Only pm_amex fails 100% on first attempt, succeeds on retry. Everything else passes.
  if (methodId === "pm_amex" && attempt === 0) return 1;
  return 0;
}

function Processing() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/processing" });
  const navigate = useNavigate();
  const tx = useTransaction(sessionId);
  const [idx, setIdx] = useState(0);
  const [failedAt, setFailedAt] = useState<number | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [attempts, setAttempts] = useState<Record<string, number>>({});

  useEffect(() => { if (tx) txStore.setCorrelationId(sessionId, getCorrelationId()); }, [tx, sessionId]);

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

  useEffect(() => {
    if (!tx || items.length === 0 || idx !== 0 || stripeFired.current) return;
    stripeFired.current = true;
    const totalAmount = tx.kind === "multi_card" ? tx.totalCents : shareTotal;
    const rl = checkRateLimit("pay-attempt");
    if (!rl.ok) {
      toast.warning(`Slow down — try again in ${rl.retryAfterSec}s`);
      return;
    }
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
          // eslint-disable-next-line no-console
          console.log(`[${getCorrelationId()}] [stripe] PaymentIntent ${result.mock ? "(mock) " : ""}created:`, result.paymentIntentId);
        }
      })
      .catch(() => {});
  }, [tx, items.length, idx, sessionId, shareTotal]);

  // Step forward, but fail this step if the method is marked to fail.
  useEffect(() => {
    if (!tx || items.length === 0 || failedAt !== null || replacing) return;
    if (idx < items.length) {
      const step = items[idx];
      const attempt = attempts[step.method.id] ?? 0;
      const t = setTimeout(() => {
        const cid = getCorrelationId();
        emit({ type: "PaymentAttempted", txId: sessionId, contributorId: null, methodId: step.method.id, at: Date.now(), correlationId: cid, actionId: newActionId("pay") });
        if (pseudoFailChance(step.method.id, attempt) > 0.5) {
          emit({ type: "PaymentFailed", txId: sessionId, contributorId: null, methodId: step.method.id, reason: "declined", at: Date.now(), correlationId: cid });
          txStore.markMethodFailed(sessionId, step.method.id, "Card declined");
          setFailedAt(idx);
        } else {
          emit({ type: "PaymentSucceeded", txId: sessionId, contributorId: null, methodId: step.method.id, amountCents: step.amountCents, at: Date.now(), correlationId: cid });
          setIdx((i) => i + 1);
        }
      }, PER_STEP_MS);
      return () => clearTimeout(t);
    }
    // All done. Route by tx.kind after a brief pause.
    const t = setTimeout(() => {
      const cid = getCorrelationId();
      if (tx.kind === "contributor") {
        const host = tx.contributors.find((c) => c.isInitiator);
        if (host) txStore.patchContributor(sessionId, host.id, { status: "paid", allocations: tx.hostAllocations });
        const latest = txStore.get(sessionId);
        const allPaid = latest?.contributors.every((c) => c.status === "paid" || c.status === "cancelled");
        if (allPaid) emit({ type: "SessionCompleted", txId: sessionId, at: Date.now(), correlationId: cid });
        navigate({
          to: allPaid ? "/checkout/$sessionId/complete" : "/checkout/$sessionId/status",
          params: { sessionId },
        });
      } else {
        emit({ type: "SessionCompleted", txId: sessionId, at: Date.now(), correlationId: cid });
        navigate({ to: "/checkout/$sessionId/complete", params: { sessionId } });
      }
    }, FINAL_WAIT_MS);
    return () => clearTimeout(t);
  }, [idx, items, tx, sessionId, navigate, failedAt, replacing, attempts]);

  function retry() {
    if (failedAt === null) return;
    const step = items[failedAt];
    const nextAttempts = { ...attempts, [step.method.id]: (attempts[step.method.id] ?? 0) + 1 };
    setAttempts(nextAttempts);
    txStore.clearFailedMethods(sessionId);
    setFailedAt(null);
  }

  function replaceMethod(replacementId: string) {
    if (failedAt === null || !tx) return;
    const step = items[failedAt];
    const newAllocs = tx.hostAllocations.map((a) =>
      a.methodId === step.method.id ? { ...a, methodId: replacementId } : a,
    );
    txStore.setHostAllocations(sessionId, newAllocs);
    txStore.clearFailedMethods(sessionId);
    setReplacing(false);
    setFailedAt(null);
  }

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
            {failedAt !== null ? "Payment declined" : idx < items.length ? `Method ${idx + 1} of ${items.length}` : "Finalizing…"}
          </p>
        </div>

        {current && (
          <ProcessingCard
            key={`${current.method.id}-${attempts[current.method.id] ?? 0}`}
            method={current.method}
            amountCents={current.amountCents}
            state={failedAt !== null ? "done" : idx < items.length ? "active" : "done"}
          />
        )}

        {failedAt !== null && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--destructive)]/30 bg-[color:var(--destructive)]/5 p-4">
            <p className="text-sm font-semibold text-[color:var(--destructive)]">
              {items[failedAt]?.method.label} was declined
            </p>
            <p className="text-xs text-muted-foreground">
              Retry the same method, replace it with another, or cancel to go to the failed screen.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={retry} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background">
                <RotateCw className="h-3 w-3" /> Retry
              </button>
              <button type="button" onClick={() => setReplacing(true)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-3 py-1.5 text-[11px] font-semibold">
                <Replace className="h-3 w-3" /> Replace method
              </button>
              <button type="button" onClick={() => navigate({ to: "/checkout/$sessionId/failed", params: { sessionId } })} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[color:var(--destructive)]">
                Cancel
              </button>
            </div>
          </div>
        )}

        <ol className="flex flex-col gap-1.5">
          {items.map((it, i) => {
            const state = failedAt === i ? "failed" : i < idx ? "done" : i === idx ? "active" : "pending";
            return (
              <li
                key={it.method.id}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
                  state === "done" ? "bg-[color:var(--success)]/10 text-[color:var(--success)]"
                  : state === "active" ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)]"
                  : state === "failed" ? "bg-[color:var(--destructive)]/10 text-[color:var(--destructive)]"
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

      <PaymentMethodSheet
        open={replacing}
        title="Choose a replacement method"
        methods={(tx?.methods ?? []).filter((m) => !items.some((it) => it.method.id === m.id) || (failedAt !== null && m.id === items[failedAt].method.id))}
        initiallySelected={[]}
        onCancel={() => setReplacing(false)}
        onAddMethod={(m) => txStore.addMethod(sessionId, m)}
        onDone={(ids) => {
          if (ids[0]) replaceMethod(ids[0]);
        }}
      />
    </CheckoutShell>
  );
}
