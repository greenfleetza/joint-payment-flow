// S05 Contributor payment — public route reachable via signed invite token /c/$token
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, CreditCard, Lock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

import { AmbientBackground } from "@/components/ambient-background";
import { GlassCard } from "@/components/glass-card";
import { StepHeader } from "@/components/step-header";
import { AmountDisplay } from "@/components/amount-display";
import { spring } from "@/lib/motion";

export const Route = createFileRoute("/c/$token")({
  head: () => ({
    meta: [
      { title: "Pay your share — ZakaPay" },
      { name: "description", content: "Contribute to a shared purchase." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContributorPayment,
});

function ContributorPayment() {
  const { token } = useParams({ from: "/c/$token" });
  const [state, setState] = useState<"form" | "processing" | "done">("form");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("processing");
    setTimeout(() => setState("done"), 1600);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <AmbientBackground />
      <div className="w-full max-w-lg">
        <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Secure link</span>
          <span className="tabular">Ref {token.slice(0, 8)}</span>
        </div>
        <GlassCard variant="strong" padding="lg">
          {state === "done" ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="flex flex-col items-center gap-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)]">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <StepHeader align="center" eyebrow="Thanks" title="Your share is authorized" description="We'll notify you when the full order is captured. Your card is only charged once every contributor has paid." />
            </motion.div>
          ) : (
            <>
              <StepHeader
                eyebrow="Northwind Threads · NW-4821"
                title="Sasha invited you to chip in"
                description="Your share of the order below. This link is single-use and expires in 60 minutes."
              />
              <div className="mt-6 flex items-end justify-between">
                <AmountDisplay amountCents={8300} size="xl" label="You pay" />
                <p className="text-xs text-muted-foreground">of $249.00 total</p>
              </div>
              <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium">Card number</span>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <input required inputMode="numeric" placeholder="4242 4242 4242 4242" className="tabular flex-1 bg-transparent text-sm outline-none" />
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium">Expiration</span>
                    <input required placeholder="MM / YY" className="tabular rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium">CVC</span>
                    <input required placeholder="CVC" className="tabular rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none" />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={state === "processing"}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform active:scale-[0.97] disabled:opacity-70"
                >
                  {state === "processing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {state === "processing" ? "Authorizing…" : "Authorize $83.00"}
                </button>
              </form>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
