import { createFileRoute } from "@tanstack/react-router";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";

import { DashboardShell } from "@/components/dashboard-shell";
import { GlassCard } from "@/components/glass-card";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — ZakaPay" },
      { name: "description", content: "Business insights and payment analytics." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Analytics,
});

const volumeData = [
  { day: "Mon", value: 2100 },
  { day: "Tue", value: 3400 },
  { day: "Wed", value: 2800 },
  { day: "Thu", value: 4200 },
  { day: "Fri", value: 5800 },
  { day: "Sat", value: 3900 },
  { day: "Sun", value: 4700 },
];

const successData = volumeData.map((d, i) => ({ day: d.day, rate: 92 + (i % 4) }));

function Analytics() {
  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--primary)]">Analytics</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">This week at a glance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Payment volume, success rate, and refund trends.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GlassCard padding="lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Payment volume</h2>
              <span className="text-xs text-muted-foreground">USD</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="fill1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="url(#fill1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard padding="lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Success rate</h2>
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={successData}>
                  <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} domain={[85, 100]} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="rate" stroke="var(--info)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardShell>
  );
}
