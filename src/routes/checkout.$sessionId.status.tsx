// S05 Contributor Payment Status — progress, cart, per-contributor actions.
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Send, Share2, CreditCard } from "lucide-react";
import { openEmailComposer, shareOrCopy } from "@/lib/email-templates";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { CartSummary } from "@/components/cart-summary";
import { EditContributorDialog } from "@/components/edit-contributor-dialog";
import { txStore, useTransaction, txPaidCents } from "@/lib/tx-store";
import { formatMoney, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

export const Route = createFileRoute("/checkout/$sessionId/status")({
  head: () => ({
    meta: [
      { title: "Split progress — ZakaPay" },
      { name: "description", content: "Live progress for your contributor split checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatusScreen,
});

function useTimeLeft(expiresAt: number | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (!expiresAt) return "";
  const ms = expiresAt - now;
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  return `${days}d ${hours}h left`;
}

function StatusScreen() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/status" });
  const navigate = useNavigate();
  const tx = useTransaction(sessionId);
  const timeLeft = useTimeLeft(tx?.expiresAt);
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const total = tx?.totalCents ?? 0;
  const paidCents = tx ? txPaidCents(tx) : 0;
  const paidCount = tx?.contributors.filter((c) => c.status === "paid").length ?? 0;
  const totalCount = tx?.contributors.length ?? 0;

  const allDone = useMemo(() => tx?.contributors.length && tx.contributors.every((c) => c.status === "paid"), [tx]);
  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => navigate({ to: "/checkout/$sessionId/complete", params: { sessionId } }), 900);
      return () => clearTimeout(t);
    }
  }, [allDone, navigate, sessionId]);

  function payFor(cid: string) {
    if (!tx) return;
    const c = tx.contributors.find((x) => x.id === cid);
    if (!c) return;
    const shareLink = typeof window !== "undefined" ? `${window.location.origin}/c/${sessionId}?to=${cid}` : `/c/${sessionId}?to=${cid}`;
    setToast(`Opening ${c.name}'s share link`);
    if (typeof window !== "undefined") {
      window.location.assign(shareLink);
    }
    setTimeout(() => setToast(null), 1600);
  }
  function remind(cid: string) {
    const c = tx?.contributors.find((x) => x.id === cid);
    if (!c || !tx) return;
    const shareLink = typeof window !== "undefined" ? `${window.location.origin}/c/${sessionId}?to=${cid}` : `/c/${sessionId}?to=${cid}`;
    const { subject, body } = buildReminderEmail({ merchantName: tx.merchantName, recipientName: c.name, recipientEmail: c.email, shareAmount: c.shareCents, link: shareLink, transactionId: sessionId });
    openEmailComposer({ recipientEmail: c.email, subject, body });
    setToast(`Reminder drafted for ${c.name}`);
    setTimeout(() => setToast(null), 1600);
  }
  async function share(cid: string) {
    const link = typeof window !== "undefined" ? `${window.location.origin}/c/${sessionId}?to=${cid}` : "";
    const didShare = await shareOrCopy(link, `${tx?.merchantName ?? "ZakaPay"} payment link`);
    setToast(didShare ? "Share dialog opened" : "Link copied");
    setTimeout(() => setToast(null), 1600);
  }

  return (
    <CheckoutShell
      merchantName={tx?.merchantName ?? ""}
      merchantInitial={tx?.merchantInitial ?? ""}
      orderReference={tx?.orderReference}
      showStepBar={false}
      showClose
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-secondary/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Contributor payment status
          </span>
          <span className="rounded-full bg-secondary/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {timeLeft}
          </span>
        </div>

        <GlassCard variant="strong" padding="lg" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">Live contributor payment status</p>
              <p className="mt-1 text-sm text-muted-foreground">Captured when every contributor has paid.</p>
            </div>
            <p className="tabular text-2xl font-semibold">{paidCount}<span className="text-muted-foreground">/{totalCount}</span></p>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${total ? (paidCents / total) * 100 : 0}%` }}
              transition={spring}
              className="h-full rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--info)]"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatMoney(paidCents)} collected</span>
            <span className="tabular">{formatMoney(total - paidCents)} remaining</span>
          </div>
        </GlassCard>

        <CartSummary items={tx?.items ?? []} subtotalCents={tx?.subtotalCents ?? 0} vatCents={tx?.vatCents ?? 0} totalCents={total} showCoupon={false} />

        <GlassCard variant="strong" padding="lg" className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">Contributors</p>
          <ul className="flex flex-col gap-2">
            {tx?.contributors.map((c) => {
              const isPaid = c.status === "paid";
              return (
                <li
                  key={c.id}
                  className={cn(
                    "rounded-2xl border p-3 backdrop-blur-md",
                    isPaid ? "border-[color:var(--success)]/25 bg-[color:var(--success)]/5" : "border-border/60 bg-card/70",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--info)] text-xs font-semibold text-white">
                      {initials(c.name || c.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}{c.isInitiator && " (Host)"}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                    </div>
                    <div className="flex flex-none flex-col items-end">
                      <span className="tabular text-sm font-semibold">{formatMoney(c.shareCents)}</span>
                      <span className={cn(
                        "mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        isPaid ? "bg-[color:var(--success)]/15 text-[color:var(--success)]" : "bg-secondary text-muted-foreground",
                      )}>
                        {isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>

                  {isPaid && c.allocations.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1 border-t border-border/60 pt-2">
                      {c.allocations.map((a) => {
                        const m = tx?.methods.find((mm) => mm.id === a.methodId);
                        return (
                          <li key={a.methodId} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{m?.label ?? "Method"}</span>
                            <span className="tabular font-medium">{formatMoney(a.amountCents)}</span>
                          </li>
                        );
                      })}
                      <li className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                        {c.allocations.length} method{c.allocations.length === 1 ? "" : "s"} used
                      </li>
                    </ul>
                  )}

                  {!isPaid && !c.isInitiator && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2">
                      <button type="button" onClick={() => payFor(c.id)} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background">
                        <CreditCard className="h-3 w-3" /> Pay for them
                      </button>
                      <button type="button" onClick={() => remind(c.id)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-3 py-1.5 text-[11px] font-semibold">
                        <Send className="h-3 w-3" /> Send reminder
                      </button>
                      <button type="button" onClick={() => share(c.id)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-3 py-1.5 text-[11px] font-semibold">
                        <Share2 className="h-3 w-3" /> Share link
                      </button>
                      <button type="button" onClick={() => setEditing(c.id)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-3 py-1.5 text-[11px] font-semibold">
                        Edit details
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </GlassCard>
      </div>

      <EditContributorDialog
        open={!!editing}
        name={tx?.contributors.find((c) => c.id === editing)?.name ?? ""}
        email={tx?.contributors.find((c) => c.id === editing)?.email ?? ""}
        shareCents={tx?.contributors.find((c) => c.id === editing)?.shareCents ?? 0}
        onCancel={() => setEditing(null)}
        onSave={(name, email) => {
          const current = tx?.contributors.find((c) => c.id === editing);
          if (current) txStore.patchContributor(sessionId, current.id, { name, email });
          setEditing(null);
        }}
      />

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 z-[9997] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background shadow-lg"
        >
          {toast}
        </motion.div>
      )}
    </CheckoutShell>
  );
}
