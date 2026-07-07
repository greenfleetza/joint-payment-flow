// Short URL landing: /c/$token — resolves to the payment status page for that tx.
// Tries Convex backend first (cross-device), falls back to localStorage.
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { txStore } from "@/lib/tx-store";
import { externalConfig } from "@/lib/external-config";

export const Route = createFileRoute("/c/$token")({
  head: () => ({
    meta: [
      { title: "Split checkout — ZakaPay" },
      { name: "description", content: "Contributor split payment status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContributorLanding,
});

function ContributorLanding() {
  const { token } = useParams({ from: "/c/$token" });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const kind = token.startsWith("M") ? "multi_card" : "contributor";

    // 1. Ensure local txStore has data (same-browser / localStorage)
    txStore.ensure(token, kind);

    // 2. If Convex is configured, try to fetch session from the cloud
    const convexUrl = externalConfig.convexUrl;
    if (convexUrl) {
      fetch(`${convexUrl}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "email:getSession",
          args: { sessionId: token },
        }),
      })
        .then((res) => res.ok ? res.json() : null)
        .then((session) => {
          if (session && session.status) {
            // Sync cloud data into local store
            txStore.update(token, {
              status: session.status === "completed" ? "complete" : session.status === "failed" ? "complete" : "collecting",
            });
          }
        })
        .catch(() => {})
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [token]);

  if (!ready) return null; // Brief loading while fetching from Convex

  const contributorId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("to") : null;

  if (contributorId) {
    return <Navigate to="/checkout/$sessionId/pay" params={{ sessionId: token }} search={{ to: contributorId }} />;
  }

  return <Navigate to="/checkout/$sessionId/status" params={{ sessionId: token }} />;
}
