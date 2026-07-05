import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard-shell";
import { GlassCard } from "@/components/glass-card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ZakaPay" },
      { name: "description", content: "Merchant workspace settings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [displayName, setDisplayName] = useState("Northwind Threads");
  const [slug, setSlug] = useState("northwind");
  const [brand, setBrand] = useState("#0071E3");
  const [contributorEnabled, setContributor] = useState(true);
  const [multiCardEnabled, setMultiCard] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">Settings</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Workspace settings</h1>
        </div>

        <GlassCard padding="lg" className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Merchant</h2>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium">Display name</span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium">Slug</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium">Contact email</span>
            <input value={email} readOnly className="rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-sm text-muted-foreground outline-none" />
          </label>
        </GlassCard>

        <GlassCard padding="lg" className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Checkout</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Contributor Split</p>
              <p className="text-xs text-muted-foreground">Primary workflow — invite others to help pay.</p>
            </div>
            <Toggle value={contributorEnabled} onChange={setContributor} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Multi-Card Split</p>
              <p className="text-xs text-muted-foreground">Secondary workflow — one buyer, multiple cards.</p>
            </div>
            <Toggle value={multiCardEnabled} onChange={setMultiCard} />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium">Brand color</span>
            <div className="flex items-center gap-2">
              <input type="color" value={brand} onChange={(e) => setBrand(e.target.value)} className="h-9 w-16 rounded-xl border border-border bg-white" />
              <input value={brand} onChange={(e) => setBrand(e.target.value)} className="tabular flex-1 rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none" />
            </div>
          </label>
        </GlassCard>

        <div className="flex justify-end">
          <button
            onClick={() => toast.success("Settings saved.")}
            className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            Save changes
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative h-6 w-10 rounded-full transition-colors ${value ? "bg-[color:var(--primary)]" : "bg-secondary"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}
