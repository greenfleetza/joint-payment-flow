import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useSessions() {
  return useQuery(api.sessions.list, {});
}

export function useSession(sessionId: string | undefined) {
  return useQuery(api.sessions.get, sessionId ? { id: sessionId as any } : "skip");
}

export function useCreateSession() {
  return useMutation(api.sessions.create);
}

export function useAddContributor() {
  return useMutation(api.sessions.addContributor);
}

export function useAddAuditEvent() {
  return useMutation(api.sessions.addAuditEvent);
}
