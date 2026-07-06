// S07 Multi-Card Setup — spread the whole total across selected cards/wallets.
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { CartSummary } from "@/components/cart-summary";
import { PaymentMethodPicker, type MethodAllocation } from "@/components/payment-method-picker";
import { PaymentMethodSheet } from "@/components/payment-method-sheet";
import { AmountDisplay } from "@/components/amount-display";
import { txStore, useTransaction } from "@/lib/tx-store";

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

function MultiCardSetup() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/cards" });
  const navigate = useNavigate();
  useEffect(() => { txStore.ensure(sessionId, "multi_card"); }, [sessionId]);
  const tx = useTransaction(sessionId);
  const total = tx?.totalCents ?? 0;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<Record<string, MethodAllocation>>({});
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!tx || selectedIds.length > 0) return;
    const first = tx.methods.slice(0, 2);
    if (first.length === 0) return;
    const per = Math.floor(total / first.length);
    const rest = total - per * first.length;
    setSelectedIds(first.map((m) => m.id));
    setAllocations(Object.fromEntries(first.map((m, i) => [m.id, { id: m.id, selected: true, amountCents: per + (i === 0 ? rest : 0) }])));
  }, [tx, total, selectedIds.length]);

  const activeMethods = useMemo(
    () => (tx?.methods ?? []).filter((m) => selectedIds.includes(m.id)),
    [tx, selectedIds],
  );
  const allocated = useMemo(
    () => activeMethods.reduce((acc, m) => acc + (allocations[m.id]?.selected ? allocations[m.id].amountCents : 0), 0),
    [activeMethods, allocations],
  );
  const canPay = allocated === total && activeMethods.length >= 1;

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
    const per = Math.floor(total / sel.length);
    const rest = total - per * sel.length;
    setAllocations((prev) => {
      const n = { ...prev };
      sel.forEach((m, i) => { n[m.id] = { id: m.id, selected: true, amountCents: per + (i === 0 ? rest : 0) }; });
      return n;
    });
  }

  function submit() {
    if (!canPay) return;
    const allocs = activeMethods
      .filter((m) => allocations[m.id]?.selected)
      .map((m) => ({ methodId: m.id, amountCents: allocations[m.id].amountCents }));
    txStore.setHostAllocations(sessionId, allocs);
    navigate({ to: "/checkout/$sessionId/processing", params: { sessionId } });
  }

  return (
    <CheckoutShell
      merchantName={tx?.merchantName ?? ""}
      merchantInitial={tx?.merchantInitial ?? ""}
      orderReference={tx?.orderReference}
      step={2}
      showClose
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-secondary/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tx {sessionId}
          </span>
        </div>

        <CartSummary items={tx?.items ?? []} subtotalCents={tx?.subtotalCents ?? 0} vatCents={tx?.vatCents ?? 0} totalCents={total} />

        <GlassCard variant="strong" padding="lg" className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">
              Total to allocate
            </span>
            <AmountDisplay amountCents={total} size="md" />
          </div>

          <PaymentMethodPicker
            methods={activeMethods}
            allocations={allocations}
            totalCents={total}
            onToggle={toggle}
            onAmountChange={setAmount}
            onRemove={removeMethod}
            onSplitEvenly={splitEvenly}
            onAddMethod={() => setSheetOpen(true)}
          />

          <button
            type="button"
            disabled={!canPay}
            onClick={submit}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
          >
            Pay (${(total / 100).toFixed(2)})
          </button>

          <div className="flex items-center">
            <Link
              to="/checkout/$sessionId"
              params={{ sessionId }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>
        </GlassCard>
      </div>

      <PaymentMethodSheet
        open={sheetOpen}
        title="Choose payment methods"
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
