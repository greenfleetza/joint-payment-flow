// Merchant dashboard shell — sidebar + header + Outlet
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, ListChecks, BarChart3, Settings, LogOut, Sparkles, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { supabase } from "@/integrations/supabase/client";
import { AmbientBackground } from "@/components/ambient-background";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/sessions", label: "Sessions", icon: ListChecks },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardShell({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [email, setEmail] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="relative min-h-screen">
      <AmbientBackground variant="quiet" />
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 flex-col gap-1 border-r border-border/60 bg-white/60 p-4 backdrop-blur-xl md:flex">
          <Link to="/" className="mb-3 flex items-center gap-2 px-2 py-2 text-sm font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            ZakaPay
          </Link>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-2 border-t border-border/60 pt-3">
            <div className="rounded-xl bg-white/60 px-3 py-2 text-xs">
              <p className="truncate font-medium">{email || "Signed in"}</p>
              <p className="text-muted-foreground">Merchant</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-border/60 bg-white/70 px-4 py-3 backdrop-blur-xl md:hidden">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            ZakaPay
          </Link>
          <button onClick={() => setMobileOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-full border border-border">
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </header>

        <AnimatePresence>
          {mobileOpen && (
            <motion.aside
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="fixed inset-x-0 top-14 z-20 mx-3 flex flex-col gap-1 rounded-2xl border border-border bg-white/95 p-3 shadow-xl backdrop-blur-xl md:hidden"
            >
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <button onClick={signOut} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main */}
        <main className="flex-1 px-5 pb-12 pt-20 md:px-10 md:pt-10">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
