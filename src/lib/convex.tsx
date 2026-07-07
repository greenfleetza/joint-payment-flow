import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, createContext, useContext, useMemo } from "react";
import { externalConfig } from "./external-config";

const convexUrl = externalConfig.convexUrl || "https://example.convex.cloud";

export const convex = new ConvexReactClient(convexUrl);

const ConvexContext = createContext<ConvexReactClient | null>(null);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => new ConvexReactClient(convexUrl), []);
  return <ConvexContext.Provider value={client}>{children}</ConvexContext.Provider>;
}

export function useConvexClient() {
  const client = useContext(ConvexContext);
  if (!client) throw new Error("Convex client not found. Wrap the app in ConvexClientProvider.");
  return client;
}

export function ConvexAppProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
