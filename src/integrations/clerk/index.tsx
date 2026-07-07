import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-react";
import type { ReactNode } from "react";
import { externalConfig } from "@/lib/external-config";

const publishableKey = externalConfig.clerkPublishableKey;

export function ClerkAppProvider({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    return <>{children}</>;
  }

  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}

export { useAuth, useUser };
