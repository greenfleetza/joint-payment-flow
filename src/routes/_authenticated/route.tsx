// Integration-managed protected layout. Redirects to /auth if not signed in.
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/integrations/clerk";

/**
 * Clerk handles auth. The ClerkProvider in root.tsx wraps all routes,
 * so useAuth() works inside the component. The beforeLoad guard
 * allows dev access when Clerk is not configured.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (!clerkKey) {
      // No Clerk configured — allow access in dev mode
      return { user: null };
    }
    // Clerk's provider handles redirects via the component below.
    return { user: null };
  },
  component: AuthGuard,
});

function AuthGuard() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  // If Clerk is configured and user is not signed in, redirect to auth
  useEffect(() => {
    if (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && !isSignedIn) {
      navigate({ to: "/auth", replace: true });
    }
  }, [isSignedIn, navigate]);

  return <Outlet />;
}
