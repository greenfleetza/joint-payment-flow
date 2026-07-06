// Short URL landing: /c/$token — resolves to the payment status page for that tx.
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { txStore } from "@/lib/tx-store";

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
  useEffect(() => {
    // Ensure the transaction exists in the store — treats the token as the tx id.
    const kind = token.startsWith("M") ? "multi_card" : "contributor";
    txStore.ensure(token, kind);
  }, [token]);

  return <Navigate to="/checkout/$sessionId/status" params={{ sessionId: token }} />;
}
