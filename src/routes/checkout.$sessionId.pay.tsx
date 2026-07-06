// S04 Pay Your Share — initiator payment. Uses PaymentMethodSheet for add-method flow.
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Lock, ArrowLeft } from "lucide-react";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { AmountDisplay } from "@/components/amount-display";
import { CartSummary } from "@/components/cart-summary";
import { PaymentMethodPicker, type MethodAllocation } from "@/components/payment-method-picker";
import { PaymentMethodSheet } from "@/components/payment-method-sheet";
import { txStore, useTransaction } from "@/lib/tx-store";

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
  useEffect(() => { txStore.ensure(sessionId, "contributor"); }, [sessionId]);
  const tx = useTransaction(sessionId);
  const initiator = tx?.contributors.find((c) => c.isInitiator);
  const share = initiator?.shareCents ?? tx?.totalCents ?? 0;

  // Which method IDs are currently selected for allocation (from the sheet).
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<Record<string, MethodAllocation>>({});
  const [sheetOpen, setSheetOpen] = useState(false);

  // Initialize: pre-select the first method with the full share
  useEffect(() => {
    if (!tx || selectedIds.length > 0) return;
    const first = tx.methods[0];
    if (!first) return;
    setSelectedIds([first.id]);
    setAllocations({ [first.id]: { id: first.id, amountCents: share, selected: true } });
  }, [tx, share, selectedIds.length]);

  const activeMethods = useMemo(
    () => (tx?.methods ?? []).filter((m) => selectedIds.includes(m.id)),
    [tx, selectedIds],
  );

  const allocated = useMemo(
    () => activeMethods.reduce((acc, m) => acc + (allocations[m.id]?.selected ? allocations[m.id].amountCents : 0), 0),
    [activeMethods, allocations],
  );
  const canPay = allocated === share && activeMethods.some((m) => allocations[m.id]?.selected);

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
    setSelectedIds((v) => v.filter((x) => x !== id));
    setAllocations((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }
  function splitEvenly() {
    const sel = activeMethods.filter((m) => allocations[m.id]?.selected);
    if (sel.length === 0) return;
    const per = Math.floor(share / sel.length);
    const rest = share - per * sel.length;
    setAllocations((prev) => {
      const n = { ...prev };
      sel.forEach((m, i) => {
        n[m.id] = { id: m.id, selected: true, amountCents: per + (i === 0 ? rest : 0) };
      });
      return n;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPay || !tx || !initiator) return;
    // Persist host allocations onto initiator contributor
    const allocs = activeMethods
      .filter((m) => allocations[m.id]?.selected)
      .map((m) => ({ methodId: m.id, amountCents: allocations[m.id].amountCents }));
    txStore.patchContributor(sessionId, initiator.id, { allocations: allocs });
    txStore.setHostAllocations(sessionId, allocs);
    navigate({ to: "/checkout/$sessionId/processing", params: { sessionId } });
  }

  return (
    <CheckoutShell
      merchantName={tx?.merchantName ?? ""}
      merchantInitial={tx?.merchantInitial ?? ""}
      orderReference={tx?.orderReference}
      step={3}
      showClose
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-secondary/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tx {sessionId}
          </span>
        </div>

        <CartSummary items={tx?.items ?? []} subtotalCents={tx?.subtotalCents ?? 0} vatCents={tx?.vatCents ?? 0} totalCents={tx?.totalCents ?? 0} />

        <GlassCard variant="strong" padding="lg" className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">
              Your share
            </span>
            <AmountDisplay amountCents={share} size="md" />
          </div>

          <PaymentMethodPicker
            methods={activeMethods}
            allocations={allocations}
            totalCents={share}
            onToggle={toggle}
            onAmountChange={setAmount}
            onRemove={removeMethod}
            onSplitEvenly={splitEvenly}
            onAddMethod={() => setSheetOpen(true)}
          />

          <button
            type="submit"
            disabled={!canPay}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
          >
            <Lock className="h-4 w-4" />
            Pay Your Share (${(share / 100).toFixed(2)})
          </button>

          <div className="flex items-center">
            <Link
              to="/checkout/$sessionId/invited"
              params={{ sessionId }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>
        </GlassCard>
      </form>

      <PaymentMethodSheet
        open={sheetOpen}
        title="Choose a payment method"
        methods={tx?.methods ?? []}
        initiallySelected={selectedIds}
        onCancel={() => setSheetOpen(false)}
        onAddMethod={(m) => txStore.addMethod(sessionId, m)}
        onDone={(ids) => {
          setSelectedIds(ids);
          setAllocations((prev) => {
            const n: Record<string, MethodAllocation> = {};
            ids.forEach((id) => {
              n[id] = prev[id] ?? { id, selected: true, amountCents: 0 };
              n[id].selected = true;
            });
            return n;
          });
          setSheetOpen(false);
        }}
      />
    </CheckoutShell>
  );
}
