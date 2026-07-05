// S04 Pay Your Share — initiator payment with multi-method picker.
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Lock, ArrowLeft } from "lucide-react";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { AmountDisplay } from "@/components/amount-display";
import { CartSummary } from "@/components/cart-summary";
import {
  PaymentMethodPicker,
  type MethodAllocation,
} from "@/components/payment-method-picker";
import { demoSession } from "@/lib/demo-session";

export const Route = createFileRoute("/checkout/$sessionId/pay")({
  head: () => ({
    meta: [
      { title: "Pay Your Share — ZakaPay" },
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
  const share = initiator.shareCents;
  const [processing, setProcessing] = useState(false);

  const [methods, setMethods] = useState(demoSession.paymentMethods);
  const [allocations, setAllocations] = useState<Record<string, MethodAllocation>>(() => {
    const map: Record<string, MethodAllocation> = {};
    demoSession.paymentMethods.forEach((m, i) => {
      map[m.id] = { id: m.id, amountCents: i === 0 ? share : 0, selected: i === 0 };
    });
    return map;
  });

  const allocated = useMemo(
    () =>
      methods.reduce((acc, m) => {
        const a = allocations[m.id];
        return acc + (a?.selected ? a.amountCents : 0);
      }, 0),
    [methods, allocations],
  );
  const canPay = allocated === share && methods.some((m) => allocations[m.id]?.selected);

  function toggle(id: string) {
    setAllocations((prev) => {
      const cur = prev[id] ?? { id, amountCents: 0, selected: false };
      return { ...prev, [id]: { ...cur, selected: !cur.selected, amountCents: cur.selected ? 0 : cur.amountCents } };
    });
  }
  function setAmount(id: string, cents: number) {
    setAllocations((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { id, selected: true, amountCents: 0 }), amountCents: cents } }));
  }
  function removeMethod(id: string) {
    setMethods((v) => v.filter((m) => m.id !== id));
    setAllocations((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }
  function splitEvenly() {
    const selectedIds = methods.filter((m) => allocations[m.id]?.selected).map((m) => m.id);
    if (selectedIds.length === 0) return;
    const per = Math.floor(share / selectedIds.length);
    const rest = share - per * selectedIds.length;
    setAllocations((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id, i) => {
        next[id] = { ...(next[id] ?? { id, selected: true, amountCents: 0 }), selected: true, amountCents: per + (i === 0 ? rest : 0) };
      });
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPay) return;
    setProcessing(true);
    setTimeout(() => navigate({ to: "/checkout/$sessionId/status", params: { sessionId } }), 1400);
  }

  return (
    <CheckoutShell
      merchantName={demoSession.merchantName}
      merchantInitial={demoSession.merchantLogoInitial}
      orderReference={demoSession.orderReference}
      step={3}
      showClose
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <CartSummary
          items={demoSession.items}
          subtotalCents={demoSession.subtotalCents}
          vatCents={demoSession.vatCents}
          totalCents={demoSession.totalCents}
        />

        <GlassCard variant="strong" padding="lg" className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">
                Your share
              </span>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Pay Your Share</h1>
            </div>
            <AmountDisplay amountCents={share} size="md" label="You pay" />
          </div>

          <PaymentMethodPicker
            methods={methods}
            allocations={allocations}
            totalCents={share}
            onToggle={toggle}
            onAmountChange={setAmount}
            onRemove={removeMethod}
            onSplitEvenly={splitEvenly}
            onAddMethod={() => {
              /* stub — real flow opens add-method sheet */
            }}
          />

          <button
            type="submit"
            disabled={!canPay || processing}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {processing ? "Processing…" : `Pay Your Share ($${(share / 100).toFixed(2)})`}
          </button>

          <div className="flex items-center justify-between">
            <Link
              to="/checkout/$sessionId/invited"
              params={{ sessionId }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <p className="text-[11px] text-muted-foreground">
              Charged only when every contributor has paid.
            </p>
          </div>
        </GlassCard>
      </form>
    </CheckoutShell>
  );
}
