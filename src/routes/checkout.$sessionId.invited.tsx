// S03 Invitation Sent — confirms invites, offers copy link.
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Mail, CheckCircle2 } from "lucide-react";

import { CheckoutShell } from "@/components/checkout-shell";
import { GlassCard } from "@/components/glass-card";
import { StepHeader } from "@/components/step-header";
import { ContributorRow } from "@/components/contributor-row";
import { CopyLinkButton } from "@/components/copy-link-button";
import { demoSession } from "@/lib/demo-session";

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

function Invited() {
  const { sessionId } = useParams({ from: "/checkout/$sessionId/invited" });
  return (
    <CheckoutShell
      merchantName={demoSession.merchantName}
      merchantInitial={demoSession.merchantLogoInitial}
      orderReference={demoSession.orderReference}
      step={2}
    >
      <GlassCard variant="strong" padding="lg" className="flex flex-col gap-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--success)]/15 text-[color:var(--success)]">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <StepHeader
            align="center"
            eyebrow="Invitations sent"
            title="Your contributors are on it"
            description="Each contributor has received a secure link to pay their share. Track everyone's status live on the next screen."
          />
        </div>

        <div className="flex flex-col gap-2">
          {demoSession.contributors.map((c) => (
            <ContributorRow
              key={c.id}
              name={c.name || c.email}
              email={c.email}
              amountCents={c.shareCents}
              status={c.status === "paid" ? "paid" : "invited"}
              isInitiator={c.isInitiator}
              action={
                !c.isInitiator ? (
                  <CopyLinkButton value={`${typeof window !== "undefined" ? window.location.origin : ""}/c/${c.id}-token`} />
                ) : null
              }
            />
          ))}
        </div>

        <GlassCard padding="sm" className="flex items-center gap-3 rounded-2xl">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Invitations expire in 1 hour. Contributors can pay from any device — no account needed.
          </p>
        </GlassCard>

        <div className="flex items-center justify-between">
          <Link
            to="/checkout/$sessionId/contributors"
            params={{ sessionId }}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Edit contributors
          </Link>
          <Link
            to="/checkout/$sessionId/pay"
            params={{ sessionId }}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform active:scale-[0.97]"
          >
            Pay your share
          </Link>
        </div>
      </GlassCard>
    </CheckoutShell>
  );
}
