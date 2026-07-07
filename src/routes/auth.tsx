import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

import { AmbientBackground } from "@/components/ambient-background";
import { GlassCard } from "@/components/glass-card";
import { useAuth, useUser } from "@/integrations/clerk";
import { getClerkSignInUrl } from "@/lib/auth-config";
import { toast } from "sonner";
import { trackEvent } from "@/lib/observability";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ZakaPay" },
      { name: "description", content: "Sign in to your ZakaPay merchant dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isSignedIn) navigate({ to: "/dashboard", replace: true });
  }, [isSignedIn, navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const signInUrl = getClerkSignInUrl("/dashboard");
      if (signInUrl) {
        window.location.href = signInUrl;
      } else {
        toast.error("Clerk is not configured. Set VITE_CLERK_PUBLISHABLE_KEY.");
      }
      trackEvent(mode === "signup" ? "auth_signup_prompted" : "auth_signin_success", { email });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const signInUrl = getClerkSignInUrl("/dashboard");
      if (signInUrl) {
        window.location.href = signInUrl;
      } else {
        toast.error("Clerk is not configured. Set VITE_CLERK_PUBLISHABLE_KEY.");
      }
      trackEvent("auth_google_started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <AmbientBackground variant="quiet" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="mb-6 flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          ZakaPay
        </Link>
        <GlassCard variant="strong" padding="lg">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to manage sessions, refunds, and settings."
              : "Set up your merchant workspace in seconds."}
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white/80 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition-colors hover:bg-white disabled:opacity-60"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => signOut?.()} 
              className="mt-3 w-full rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground"
            >
              Sign out
            </button>
          ) : null}

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="you@company.com"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">Password</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="At least 8 characters"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform active:scale-[0.97] disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "signin" ? "No account yet?" : "Already have one?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.67-2.26 1.06-3.71 1.06-2.85 0-5.27-1.93-6.13-4.52H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.87 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.69-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.69 2.84C6.73 7.3 9.15 5.38 12 5.38z" />
    </svg>
  );
}
