// Convex helpers — provides typed hooks for the Convex backend.
// These helpers gracefully degrade when Convex is not deployed yet.
// After running `npx convex dev`, the generated API will be available.

import { useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";

// Lazy-load the generated API module
let cachedApi: any = null;
let loadPromise: Promise<any> | null = null;

function loadApi() {
  if (cachedApi) return Promise.resolve(cachedApi);
  if (loadPromise) return loadPromise;
  loadPromise = import("../../convex/_generated/api")
    .then((mod) => { cachedApi = mod.default ?? mod; return cachedApi; })
    .catch(() => { cachedApi = null; return null; });
  return loadPromise;
}

function useConvexApi() {
  const [api, setApi] = useState<any>(cachedApi);
  useEffect(() => {
    if (!cachedApi) loadApi().then(setApi);
  }, []);
  return api;
}

// All hooks are called unconditionally — we pass "skip" when the API isn't ready.
// This complies with React's Rules of Hooks.

export function useSessions() {
  const api = useConvexApi();
  return useQuery(api?.sessions?.list ?? ("skip" as any), {});
}

export function useSession(id: string | undefined) {
  const api = useConvexApi();
  return useQuery(api?.sessions?.get ?? ("skip" as any), id ? { id: id as any } : "skip");
}

export function useCreateSession() {
  const api = useConvexApi();
  return useMutation(api?.sessions?.create ?? ("skip" as any));
}

export function useAddContributor() {
  const api = useConvexApi();
  return useMutation(api?.sessions?.addContributor ?? ("skip" as any));
}

export function useAddAuditEvent() {
  const api = useConvexApi();
  return useMutation(api?.sessions?.addAuditEvent ?? ("skip" as any));
}
