// S08 Payment Processing — sequential authorization visualization
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { StepHeader } from "@/components/step-header";
import { AmountDisplay } from "@/components/amount-display";
import { demoSession } from "@/lib/demo-session";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout/$sessionId/processing")({
  head: () => ({
    meta: [
      { title: "Processing — ZakaPay" },
      { name: "description", content: "Authorizing your cards." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Processing,
});

const demoCards = [
  { id: "c1", label: "Debit ending 4321", amountCents: 12450 },
  { id: "c2", label: "Credit ending 8890", amountCents: 12450 },
];

function Processing() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/processing" });
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx >= demoCards.length) {
      const t = setTimeout(() => navigate({ to: "/checkout/$sessionId/complete", params: { sessionId } }), 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIdx((i) => i + 1), 1400);
    return () => clearTimeout(t);
  }, [idx, navigate, sessionId]);

  return (
    <CheckoutShell
      merchantName={demoSession.merchantName}
      merchantInitial={demoSession.merchantLogoInitial}
      orderReference={demoSession.orderReference}
      step={3}
    >
      <GlassCard variant="strong" padding="lg" className="flex flex-col gap-7">
        <StepHeader
          eyebrow="Authorizing"
          title="Processing your payment"
          description="Each card is authorized in sequence, then captured together as a single successful payment."
        />
        <div className="flex justify-center">
          <AmountDisplay amountCents={demoSession.totalCents} size="xl" tone="muted" label="Total" />
        </div>
        <ol className="flex flex-col gap-2">
          {demoCards.map((c, i) => {
            const state = i < idx ? "done" : i === idx ? "active" : "pending";
            return (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3.5 backdrop-blur-md",
                  state === "active" && "border-[color:var(--primary)]/50",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    state === "done" && "bg-[color:var(--success)]/15 text-[color:var(--success)]",
                    state === "active" && "bg-[color:var(--primary)]/12 text-[color:var(--primary)]",
                    state === "pending" && "bg-secondary text-muted-foreground",
                  )}
                >
                  {state === "done" ? <Check className="h-4 w-4" /> : state === "active" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {state === "done" ? "Authorized" : state === "active" ? "Authorizing…" : "Waiting"}
                  </p>
                </div>
                <span className="tabular text-sm font-semibold">{formatMoney(c.amountCents)}</span>
              </motion.li>
            );
          })}
        </ol>
      </GlassCard>
    </CheckoutShell>
  );
}
