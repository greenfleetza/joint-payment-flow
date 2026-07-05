// S09 Payment Complete
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { StepHeader } from "@/components/step-header";
import { AmountDisplay } from "@/components/amount-display";
import { demoSession } from "@/lib/demo-session";
import { spring } from "@/lib/motion";

export const Route = createFileRoute("/checkout/$sessionId/complete")({
  head: () => ({
    meta: [
      { title: "Payment complete — ZakaPay" },
      { name: "description", content: "The order is paid in full." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Complete,
});

function Complete() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/complete" });
  return (
    <CheckoutShell
      merchantName={demoSession.merchantName}
      merchantInitial={demoSession.merchantLogoInitial}
      orderReference={demoSession.orderReference}
    >
      <GlassCard variant="strong" padding="lg" className="flex flex-col items-center gap-6 text-center">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)]"
        >
          <CheckCircle2 className="h-8 w-8" />
        </motion.span>
        <StepHeader
          align="center"
          eyebrow="Payment complete"
          title="You're all set"
          description={`${demoSession.merchantName} has received a single successful payment. A receipt is on its way to every contributor.`}
        />
        <AmountDisplay amountCents={demoSession.totalCents} size="xl" tone="success" label="Order paid" />
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform active:scale-[0.97]"
          >
            Done
          </Link>
          <Link
            to="/checkout/$sessionId"
            params={{ sessionId }}
            className="inline-flex items-center rounded-full border border-border bg-white/70 px-5 py-2.5 text-sm font-medium backdrop-blur-md"
          >
            Start another
          </Link>
        </div>
      </GlassCard>
    </CheckoutShell>
  );
}
