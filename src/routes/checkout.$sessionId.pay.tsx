// S04 Pay Your Share — initiator payment (mocked)
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, CreditCard, Lock } from "lucide-react";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { StepHeader } from "@/components/step-header";
import { AmountDisplay } from "@/components/amount-display";
import { demoSession } from "@/lib/demo-session";

export const Route = createFileRoute("/checkout/$sessionId/pay")({
  head: () => ({
    meta: [
      { title: "Pay your share — ZakaPay" },
      { name: "description", content: "Authorize your portion of this split checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PayShare,
});

function PayShare() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/pay" });
  const navigate = useNavigate();
  const initiator = demoSession.contributors.find((c) => c.isInitiator)!;
  const [processing, setProcessing] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);
    // Mock authorization delay — real flow: initiatePayment server fn + Stripe Elements
    setTimeout(() => navigate({ to: "/checkout/$sessionId/status", params: { sessionId } }), 1400);
  }

  return (
    <CheckoutShell
      merchantName={demoSession.merchantName}
      merchantInitial={demoSession.merchantLogoInitial}
      orderReference={demoSession.orderReference}
      step={3}
    >
      <GlassCard variant="strong" padding="lg" className="flex flex-col gap-7">
        <StepHeader
          eyebrow="Your share"
          title="Authorize your portion"
          description="Your card is only charged when every contributor has paid. If the session expires, no card is charged."
        />
        <div className="flex items-end justify-between">
          <AmountDisplay amountCents={initiator.shareCents} size="xl" label="You pay" />
          <p className="text-xs text-muted-foreground">of {demoSession.totalCents / 100} total</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium">Card number</span>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <input
                required
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                className="tabular flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">Expiration</span>
              <input required placeholder="MM / YY" className="tabular rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">CVC</span>
              <input required placeholder="CVC" className="tabular rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none" />
            </label>
          </div>
          <button
            type="submit"
            disabled={processing}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform active:scale-[0.97] disabled:opacity-70"
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {processing ? "Authorizing…" : `Authorize ${(initiator.shareCents / 100).toFixed(2)} USD`}
          </button>
          <p className="text-center text-[11px] text-muted-foreground">
            Preview — real Stripe Elements integration wires in during the payments phase.
          </p>
        </form>

        <div className="flex items-center justify-between">
          <Link
            to="/checkout/$sessionId/invited"
            params={{ sessionId }}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back
          </Link>
        </div>
      </GlassCard>
    </CheckoutShell>
  );
}
