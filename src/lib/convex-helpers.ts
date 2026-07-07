// Convex helpers — typed hooks for the Convex backend.
// After running `npx convex dev`, generated files are available.
// Before that, hooks return undefined gracefully.

import { useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";

// Lazy-load the generated API module once
let _api: any = null;
let _loaded = false;
let _loading: Promise<any> | null = null;

async function loadApi() {
  if (_loaded) return _api;
  if (_loading) return _loading;
  _loading = import(/* @vite-ignore */ "../../convex/_generated/api")
    .then((m) => { _api = m.default ?? m; _loaded = true; return _api; })
    .catch(() => { _api = null; _loaded = true; return null; })
    .finally(() => { _loading = null; });
  return _loading;
}

function useLazyApi() {
  const [api, setApi] = useState<any>(_loaded ? _api : null);
  useEffect(() => {
    if (!_loaded) loadApi().then(setApi);
  }, []);
  return api;
}

// All hooks called unconditionally (Rules of Hooks).
// When api is null, Convex uses "skip" to skip the query/mutation.

export function useSessions() {
  const api = useLazyApi();
  return useQuery(api?.sessions?.list ?? ("skip" as any), {});
}

export function useSession(id: string | undefined) {
  const api = useLazyApi();
  return useQuery(api?.sessions?.get ?? ("skip" as any), id ? { id: id as any } : "skip");
}

export function useCreateSession() {
  const api = useLazyApi();
  return useMutation(api?.sessions?.create ?? ("skip" as any));
}

export function useAddContributor() {
  const api = useLazyApi();
  return useMutation(api?.sessions?.addContributor ?? ("skip" as any));
}

export function useAddAuditEvent() {
  const api = useLazyApi();
  return useMutation(api?.sessions?.addAuditEvent ?? ("skip" as any));
}
