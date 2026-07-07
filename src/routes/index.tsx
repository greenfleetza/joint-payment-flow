import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Users, CreditCard, ShieldCheck, Sparkles } from "lucide-react";

import { AmbientBackground } from "@/components/ambient-background";
import { GlassCard } from "@/components/glass-card";
import { AmountDisplay } from "@/components/amount-display";
import { ContributorRow } from "@/components/contributor-row";
import { PaymentStatusPill } from "@/components/payment-status-pill";
import { fadeUp, spring, stagger } from "@/lib/motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZakaPay — Pay together, checkout as one" },
      {
        name: "description",
        content:
          "A single successful payment for merchants. A frictionless split for buyers. ZakaPay orchestrates contributor and multi-card checkouts.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AmbientBackground />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          ZakaPay
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#products" className="transition-colors hover:text-foreground">Products</a>
          <a href="#merchants" className="transition-colors hover:text-foreground">For merchants</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="hidden rounded-full border border-border bg-white/60 px-3.5 py-1.5 text-sm font-medium backdrop-blur-md transition-colors hover:bg-white sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/checkout/$sessionId"
            params={{ sessionId: "demo" }}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-transform active:scale-[0.97]"
          >
            Try a checkout
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-14 px-6 pb-16 pt-10 md:pb-24 md:pt-16 lg:grid-cols-[1.05fr_1fr]">
        <motion.div initial="hidden" animate="visible" variants={stagger(0.06)} className="flex flex-col gap-7">
          <motion.span
            variants={fadeUp}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)]" />
            Now in preview — MVP release
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="text-balance text-5xl font-semibold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl"
          >
            Pay together.
            <br />
            <span className="bg-gradient-to-r from-[color:var(--primary)] via-[color:var(--info)] to-[color:var(--destructive)] bg-clip-text text-transparent">
              Checkout as one.
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} className="max-w-lg text-pretty text-lg text-muted-foreground">
            ZakaPay orchestrates multi-source payments — contributors, multiple cards, or both — so a
            single successful payment reaches the merchant while buyers finish checkout in a few taps.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
            <Link
              to="/checkout/$sessionId"
              params={{ sessionId: "demo" }}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform active:scale-[0.97]"
            >
              Try a live checkout
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center rounded-full border border-border bg-white/70 px-5 py-3 text-sm font-medium backdrop-blur-md transition-colors hover:bg-white"
            >
              Open merchant dashboard
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...spring, delay: 0.1 }}
          className="relative"
        >
          <GlassCard variant="strong" padding="lg" className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background">
                  N
                </div>
                <div>
                  <p className="text-sm font-semibold">Northwind Threads</p>
                  <p className="text-xs text-muted-foreground">Order NW-4821</p>
                </div>
              </div>
              <PaymentStatusPill status="processing" />
            </div>
            <div className="flex items-end justify-between gap-4">
              <AmountDisplay amountCents={24900} size="xl" label="Order total" />
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Collected</p>
                <p className="tabular text-lg font-semibold text-[color:var(--success)]">$166.00</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <ContributorRow name="You" email="you@example.com" amountCents={8300} status="authorized" isInitiator />
              <ContributorRow name="Sasha Morgan" email="sasha@example.com" amountCents={8300} status="paid" />
              <ContributorRow name="Priya Rao" email="priya@example.com" amountCents={8300} status="viewed" />
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-col gap-3 text-center items-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">
            Simple 3-step process
          </span>
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            How ZakaPay works
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            From checkout to confirmed payment in three easy steps — no complex integrations required.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <GlassCard padding="lg" className="flex flex-col gap-4 items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--primary)]/12 text-[color:var(--primary)]">
              <span className="text-2xl font-bold">1</span>
            </span>
            <h3 className="text-lg font-semibold tracking-tight">Create a session</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The merchant initiates a checkout. ZakaPay generates a unique payment link and calculates each contributor's share or prepares the multi-card allocation flow.
            </p>
          </GlassCard>
          <GlassCard padding="lg" className="flex flex-col gap-4 items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--info)]/12 text-[color:var(--info)]">
              <span className="text-2xl font-bold">2</span>
            </span>
            <h3 className="text-lg font-semibold tracking-tight">Contributors pay</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each contributor opens their unique link — no account needed — and pays their share using any card or digital wallet. Invitations are sent via email or share link.
            </p>
          </GlassCard>
          <GlassCard padding="lg" className="flex flex-col gap-4 items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--success)]/12 text-[color:var(--success)]">
              <span className="text-2xl font-bold">3</span>
            </span>
            <h3 className="text-lg font-semibold tracking-tight">One payment captured</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Once all shares are collected, Stripe captures a single Payment Intent. The merchant receives one successful payment — zero contributor complexity on their end.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-col gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">
            Two workflows, one engine
          </span>
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Every checkout deserves more than one payment source.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <GlassCard padding="lg" className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--primary)]/12 text-[color:var(--primary)]">
                <Users className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-[color:var(--primary)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--primary)]">
                Primary
              </span>
            </div>
            <h3 className="text-xl font-semibold tracking-tight">Contributor Split</h3>
            <p className="text-sm text-muted-foreground">
              Invite friends, family or teammates to fund portions of a single purchase. Each contributor
              pays through a secure signed link. The merchant sees one successful payment.
            </p>
          </GlassCard>
          <GlassCard padding="lg" className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--info)]/12 text-[color:var(--info)]">
                <CreditCard className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Secondary
              </span>
            </div>
            <h3 className="text-xl font-semibold tracking-tight">Multi-Card Split</h3>
            <p className="text-sm text-muted-foreground">
              One buyer, multiple cards. Combine debit and credit, or spread the total across payment
              methods that carry per-transaction limits — sequentially authorized, atomically captured.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* Merchant strip */}
      <section id="merchants" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16">
        <GlassCard variant="strong" padding="lg" className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">
              For merchants
            </span>
            <h3 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
              One integration. One successful payment. Zero contributor complexity.
            </h3>
            <p className="max-w-xl text-sm text-muted-foreground">
              Embed the checkout, receive a single captured Payment Intent, and hand off refunds and
              audit trails to the dashboard. Contributor coordination, invitations, expirations and
              recovery are managed for you.
            </p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[color:var(--success)]" /> Stripe-backed manual capture with realtime status.</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[color:var(--success)]" /> Full audit trail for every state transition.</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[color:var(--success)]" /> Refund workflow with partial + full support.</li>
            </ul>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 justify-self-start rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform active:scale-[0.97] md:justify-self-end"
          >
            Open the dashboard
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </GlassCard>
      </section>

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-10 pt-4 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} ZakaPay. All rights reserved.</p>
        <p>Coordinating payments, invisibly.</p>
      </footer>
    </div>
  );
}
