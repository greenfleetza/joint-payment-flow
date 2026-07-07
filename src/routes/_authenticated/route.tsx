// Integration-managed protected layout. Redirects to /auth if not signed in.
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuth } from "@/integrations/clerk";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (!clerkKey) {
      return { user: null };
    }

    try {
      return { user: null };
    } catch {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
