// Payment failed screen — shown when a payment attempt could not be authorized.
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { XCircle, RotateCw } from "lucide-react";
import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { useTransaction, txStore } from "@/lib/tx-store";

export const Route = createFileRoute("/checkout/$sessionId/failed")({
  head: () => ({
    meta: [
      { title: "Payment failed — ZakaPay" },
      { name: "description", content: "The payment attempt did not complete." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Failed,
});

function Failed() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/failed" });
  const navigate = useNavigate();
  const tx = useTransaction(sessionId);
  const failed = tx?.failedMethods ?? [];

  function retry() {
    txStore.clearFailedMethods(sessionId);
    navigate({
      to: tx?.kind === "multi_card" ? "/checkout/$sessionId/cards" : "/checkout/$sessionId/pay",
      params: { sessionId },
    });
  }

  return (
    <CheckoutShell
      merchantName={tx?.merchantName ?? "ZakaPay"}
      merchantInitial={tx?.merchantInitial ?? "Z"}
      orderReference={tx?.orderReference}
      showStepBar={false}
      showClose
    >
      <GlassCard variant="strong" padding="lg" className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--destructive)]/15 text-[color:var(--destructive)]">
          <XCircle className="h-8 w-8" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--destructive)]">Payment failed</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">We couldn't authorize your payment</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Transaction {sessionId} · No funds were captured. You can retry with the same methods or replace the failed ones.
          </p>
          {failed.length > 0 && (
            <ul className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs">
              {failed.map((id) => {
                const m = tx?.methods.find((x) => x.id === id);
                return (
                  <li key={id} className="rounded-full bg-[color:var(--destructive)]/10 px-2.5 py-1 font-medium text-[color:var(--destructive)]">
                    {m?.label ?? id} failed
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
          >
            <RotateCw className="h-4 w-4" /> Retry & replace methods
          </button>
          <Link
            to="/"
            className="inline-flex items-center rounded-full border border-border bg-white/70 px-5 py-2.5 text-sm font-medium backdrop-blur-md"
          >
            Cancel
          </Link>
        </div>
      </GlassCard>
    </CheckoutShell>
  );
}
