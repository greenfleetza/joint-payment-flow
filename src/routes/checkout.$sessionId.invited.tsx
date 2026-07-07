// S03 Invitation Sent — shows every contributor for this tx, edit dialog, split action row.
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check, Pencil, Mail, Share2 } from "lucide-react";
import { motion } from "framer-motion";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { CartSummary } from "@/components/cart-summary";
import { EditContributorDialog } from "@/components/edit-contributor-dialog";
import { txStore, useTransaction } from "@/lib/tx-store";
import { formatMoney, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { spring, tapScale } from "@/lib/motion";
import { shareOrCopy } from "@/lib/email-templates";

export const Route = createFileRoute("/checkout/$sessionId/invited")({
  head: () => ({
    meta: [
      { title: "Invitations sent — ZakaPay" },
      { name: "description", content: "Contributor invitations are on their way." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Invited,
});

const DELIVERY_STYLES: Record<string, string> = {
  read: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
  delivered: "bg-[color:var(--info)]/12 text-[color:var(--info)]",
  sent: "bg-secondary text-muted-foreground",
  undelivered: "bg-destructive/12 text-destructive",
};

function Invited() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/invited" });
  const navigate = useNavigate();
  const tx = useTransaction(sessionId);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const shortUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/c/${sessionId}`
      : `zaka.pay/c/${sessionId}`;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  async function openShareDialog() {
    setShareOpen(true);
    await shareOrCopy(shortUrl, `Share ${tx?.merchantName ?? "your payment"}`);
    setShareOpen(false);
  }

  const goStatus = () => navigate({ to: "/checkout/$sessionId/status", params: { sessionId } });
  const goPay = () => navigate({ to: "/checkout/$sessionId/pay", params: { sessionId } });

  const editingC = tx?.contributors.find((c) => c.id === editing);

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
            Invitation sent
          </span>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-white/70 p-4 text-center backdrop-blur-md">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-2">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate text-xs font-medium">{shortUrl}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={copyUrl}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-background"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <motion.button
              type="button"
              onClick={openShareDialog}
              whileTap={tapScale}
              transition={spring}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-foreground"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share link
            </motion.button>
          </div>
        </div>

      {/* Split action row — share link + pay your share + payment status */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={openShareDialog}
          className="flex-1 min-w-[120px] rounded-full border border-border bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground backdrop-blur-md transition-colors hover:bg-white"
        >
          <Share2 className="inline h-3 w-3 mr-1" />
          Share Link
        </button>
        <button
          type="button"
          onClick={goPay}
          className="flex-1 min-w-[120px] rounded-full bg-foreground px-3 py-2 text-xs font-semibold uppercase tracking-wider text-background transition-transform active:scale-[0.97]"
        >
          Pay Your Share
        </button>
        <button
          type="button"
          onClick={() => window.open(`/checkout/${sessionId}/status`, "_blank")}
          className="rounded-full border border-border bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground backdrop-blur-md transition-colors hover:bg-white"
        >
          Payment Status
        </button>
      </div>

        <CartSummary items={tx?.items ?? []} subtotalCents={tx?.subtotalCents ?? 0} vatCents={tx?.vatCents ?? 0} totalCents={tx?.totalCents ?? 0} showCoupon={false} />

        <GlassCard variant="strong" padding="lg" className="flex flex-col gap-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">
            Contributors
          </p>

          <div className="flex flex-col gap-2">
            {tx?.contributors.map((c) => {
              const delivery = c.isInitiator ? "read" : c.delivery;
              return (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 backdrop-blur-md",
                    c.isInitiator ? "border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5" : "border-border/60 bg-card/70",
                  )}
                >
                  <div
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--info)] text-sm font-semibold text-white"
                    aria-hidden
                  >
                    {initials(c.name || c.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      {c.isInitiator && (
                        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Host / You · {c.name}</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1.5">
                    <span className="tabular text-sm font-semibold">{formatMoney(c.shareCents)}</span>
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", DELIVERY_STYLES[delivery])}>
                      {delivery}
                    </span>
                  </div>
                  {!c.isInitiator && (
                    <button
                      type="button"
                      onClick={() => setEditing(c.id)}
                      aria-label={`Edit ${c.name}`}
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Invitations expire in 7 days. Contributors can pay from any device — no account needed.
          </p>
        </GlassCard>

        <EditContributorDialog
          open={!!editingC}
          name={editingC?.name ?? ""}
          email={editingC?.email ?? ""}
          shareCents={editingC?.shareCents ?? 0}
          onCancel={() => setEditing(null)}
          onSave={(name, email) => {
            if (editingC) txStore.patchContributor(sessionId, editingC.id, { name, email });
            setEditing(null);
          }}
        />
      </div>
    </CheckoutShell>
  );
}
