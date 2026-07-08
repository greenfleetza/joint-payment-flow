// Session expired screen — shown when a transaction is past its 7-day expiry.
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { useTransaction } from "@/lib/tx-store";

export const Route = createFileRoute("/checkout/$sessionId/expired")({
  head: () => ({
    meta: [
      { title: "Session expired — ZakaPay" },
      { name: "description", content: "This checkout session has expired." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Expired,
});

function Expired() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/expired" });
  const tx = useTransaction(sessionId);
  return (
    <CheckoutShell
      merchantName={tx?.merchantName ?? "ZakaPay"}
      merchantInitial={tx?.merchantInitial ?? "Z"}
      orderReference={tx?.orderReference}
      showStepBar={false}
    >
      <GlassCard variant="strong" padding="lg" className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--warning)]/15 text-[color:var(--warning)]">
          <Clock className="h-8 w-8" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--warning)]">Session expired</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">This split has expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Transaction {sessionId} passed its 7-day payment window. Ask the host to start a new split, or return home.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
        >
          Return home
        </Link>
      </GlassCard>
    </CheckoutShell>
  );
}
