// Checkout entry — S01 Split Method Selection.
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Users, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { StepHeader } from "@/components/step-header";
import { AmountDisplay } from "@/components/amount-display";
import { SplitMethodTile } from "@/components/split-method-tile";
import { demoSession } from "@/lib/demo-session";
import { spring, tapScale } from "@/lib/motion";

export const Route = createFileRoute("/checkout/$sessionId/")({
  head: () => ({
    meta: [
      { title: "Choose how to pay — ZakaPay" },
      { name: "description", content: "Split this checkout with contributors or across multiple cards." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SplitMethod,
});

function SplitMethod() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/" });
  const [method, setMethod] = useState<"contributor" | "multi_card" | null>(null);

  return (
    <CheckoutShell
      merchantName={demoSession.merchantName}
      merchantInitial={demoSession.merchantLogoInitial}
      orderReference={demoSession.orderReference}
      step={1}
    >
      <GlassCard variant="strong" padding="lg" className="flex flex-col gap-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <StepHeader
            eyebrow="Step 1 of 3"
            title="How would you like to pay?"
            description="Split the order with contributors, or spread it across multiple cards."
          />
          <AmountDisplay amountCents={demoSession.totalCents} size="lg" label="Order total" />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SplitMethodTile
            icon={Users}
            title="Contributor Split"
            description="Invite friends, family or teammates to fund portions of this purchase."
            badge="Recommended"
            selected={method === "contributor"}
            onSelect={() => setMethod("contributor")}
          />
          <SplitMethodTile
            icon={CreditCard}
            title="Multi-Card Split"
            description="One buyer, multiple cards — spread the total across payment methods."
            selected={method === "multi_card"}
            onSelect={() => setMethod("multi_card")}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            You can always change split method before payment starts.
          </p>
          <motion.div whileTap={tapScale} transition={spring}>
            <Link
              to={method === "multi_card" ? "/checkout/$sessionId/cards" : "/checkout/$sessionId/contributors"}
              params={{ sessionId }}
              aria-disabled={!method}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform active:scale-[0.97] aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              Continue
            </Link>
          </motion.div>
        </div>
      </GlassCard>
    </CheckoutShell>
  );
}
