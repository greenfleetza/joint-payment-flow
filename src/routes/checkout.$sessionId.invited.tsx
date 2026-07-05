// S03 Invitation Sent — confirms invites, shows delivery status, transaction link.
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check, Pencil, Mail } from "lucide-react";
import { motion } from "framer-motion";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { CartSummary } from "@/components/cart-summary";
import { demoSession, type DeliveryStatus } from "@/lib/demo-session";
import { formatMoney, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { spring, tapScale } from "@/lib/motion";

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

const DELIVERY_STYLES: Record<DeliveryStatus, string> = {
  read: "bg-[color:var(--success)]/15 text-[color:var(--success-foreground)]",
  delivered: "bg-[color:var(--info)]/12 text-[color:var(--info)]",
  sent: "bg-secondary text-muted-foreground",
  undelivered: "bg-destructive/12 text-destructive",
};

const DELIVERY_LABEL: Record<DeliveryStatus, string> = {
  read: "Read",
  sent: "Sent",
  delivered: "Delivered",
  undelivered: "Undelivered",
};

function Invited() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/invited" });
  const [copied, setCopied] = useState(false);
  const shortUrl =
    typeof window !== "undefined"
      ? `${window.location.host}/${demoSession.transactionCode}`
      : `zaka.pay/${demoSession.transactionCode}`;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(`https://${shortUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <CheckoutShell
      merchantName={demoSession.merchantName}
      merchantInitial={demoSession.merchantLogoInitial}
      orderReference={demoSession.orderReference}
      step={2}
      showClose
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/checkout/$sessionId/contributors"
            params={{ sessionId }}
            className="inline-flex items-center justify-center rounded-full border border-border bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground backdrop-blur-md transition-colors hover:bg-white"
          >
            Payment Status
          </Link>

          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-2 backdrop-blur-md">
            <Mail className="h-3.5 w-3.5 flex-none text-muted-foreground" />
            <span className="tabular min-w-0 flex-1 truncate text-xs font-medium text-foreground">
              {shortUrl}
            </span>
            <motion.button
              type="button"
              onClick={copyUrl}
              whileTap={tapScale}
              transition={spring}
              aria-label="Copy transaction link"
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </motion.button>
          </div>

          <Link
            to="/checkout/$sessionId/pay"
            params={{ sessionId }}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wider text-background transition-transform active:scale-[0.97]"
          >
            Pay Your Share
          </Link>
        </div>

        <CartSummary
          items={demoSession.items}
          subtotalCents={demoSession.subtotalCents}
          vatCents={demoSession.vatCents}
          totalCents={demoSession.totalCents}
          showCoupon={false}
        />

        <GlassCard variant="strong" padding="lg" className="flex flex-col gap-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">
            Contributors
          </p>

          <div className="flex flex-col gap-2">
            {demoSession.contributors.map((c) => {
              const delivery: DeliveryStatus = c.isInitiator ? "read" : c.delivery ?? "sent";
              return (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 backdrop-blur-md",
                    c.isInitiator
                      ? "border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5"
                      : "border-border/60 bg-card/70",
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
                        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Host
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1.5">
                    <span className="tabular text-sm font-semibold">{formatMoney(c.shareCents)}</span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        DELIVERY_STYLES[delivery],
                      )}
                    >
                      {DELIVERY_LABEL[delivery]}
                    </span>
                  </div>
                  {!c.isInitiator && (
                    <button
                      type="button"
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
            Invitations expire in 1 hour. Contributors can pay from any device — no account needed.
          </p>
        </GlassCard>
      </div>
    </CheckoutShell>
  );
}
