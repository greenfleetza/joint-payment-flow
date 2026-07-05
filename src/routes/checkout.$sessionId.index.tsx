// Checkout entry — S01 Split Method Selection.
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { motion } from "framer-motion";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { CartSummary } from "@/components/cart-summary";
import { demoSession } from "@/lib/demo-session";
import { spring, tapScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

import splitPeople from "@/assets/split-people.jpg";
import splitCards from "@/assets/split-cards.jpg";

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
  const navigate = useNavigate();

  const go = (method: "contributor" | "multi_card") =>
    navigate({
      to: method === "multi_card" ? "/checkout/$sessionId/cards" : "/checkout/$sessionId/contributors",
      params: { sessionId },
    });

  return (
    <CheckoutShell
      merchantName={demoSession.merchantName}
      merchantInitial={demoSession.merchantLogoInitial}
      orderReference={demoSession.orderReference}
      showStepBar={false}
      showClose
    >
      <div className="flex flex-col gap-5">
        <CartSummary
          items={demoSession.items}
          subtotalCents={demoSession.subtotalCents}
          vatCents={demoSession.vatCents}
          totalCents={demoSession.totalCents}
        />

        <GlassCard variant="strong" padding="md" className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">
              Choose your split
            </span>
            <p className="text-sm text-muted-foreground">
              Bring in friends, or spread the charge across your own cards.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MethodTile
              title="Split with Others"
              description="Invite friends, family or teammates to fund portions."
              image={splitPeople}
              onSelect={() => go("contributor")}
            />
            <MethodTile
              title="Split across Cards"
              description="One buyer, multiple cards & wallets."
              image={splitCards}
              onSelect={() => go("multi_card")}
            />
          </div>
        </GlassCard>
      </div>
    </CheckoutShell>
  );
}

function MethodTile({
  title,
  description,
  image,
  onSelect,
}: {
  title: string;
  description: string;
  image: string;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={tapScale}
      whileHover={{ y: -2 }}
      transition={spring}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-white/80 text-left backdrop-blur-md transition-colors hover:border-[color:var(--primary)]/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
        <img
          src={image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-col gap-1 px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </motion.button>
  );
}
