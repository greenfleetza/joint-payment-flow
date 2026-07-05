import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AmbientBackground } from "@/components/ambient-background";
import { AppToaster } from "@/components/app-toaster";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AmbientBackground variant="quiet" />
      <div className="glass max-w-md rounded-3xl p-10 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">This page can't be found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may have expired or the session has been completed.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform active:scale-[0.97]"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AmbientBackground variant="warm" />
      <div className="glass max-w-md rounded-3xl p-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Something went sideways</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't complete that request. Try again or head back to safety.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform active:scale-[0.97]"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-white/70 px-5 py-2.5 text-sm font-medium backdrop-blur-md"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ZakaPay — Pay together, checkout as one" },
      {
        name: "description",
        content:
          "ZakaPay coordinates multiple payment sources into a single checkout — split with contributors or across multiple cards, without merchant complexity.",
      },
      { name: "author", content: "ZakaPay" },
      { name: "theme-color", content: "#0071E3" },
      { property: "og:title", content: "ZakaPay — Pay together, checkout as one" },
      {
        property: "og:description",
        content:
          "Split a single checkout across contributors or cards. Merchants receive one successful payment, buyers get a frictionless experience.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ZakaPay — Pay together, checkout as one" },
      { name: "description", content: "A single successful payment for merchants. A frictionless split for buyers. ZakaPay orchestrates contributor and multi-card checkouts." },
      { property: "og:description", content: "A single successful payment for merchants. A frictionless split for buyers. ZakaPay orchestrates contributor and multi-card checkouts." },
      { name: "twitter:description", content: "A single successful payment for merchants. A frictionless split for buyers. ZakaPay orchestrates contributor and multi-card checkouts." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/7dd17581-f2e1-4004-adf7-360f6ec81f48" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/7dd17581-f2e1-4004-adf7-360f6ec81f48" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <AppToaster />
    </QueryClientProvider>
  );
}
