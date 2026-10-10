"use client";

import { useQuery } from "@tanstack/react-query";
import * as z from "zod";

import { parseData } from "@/lib/api/envelope";
import { api } from "@/lib/axios";

/** The signed-in user, as returned by the backend's "who am I" endpoint. */
export const currentUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string(),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;

/**
 * Current-user accessor. Hits the BFF (`/api/auth/me`), which forwards to the
 * backend with the httpOnly cookie attached, then unwraps + validates the
 * envelope. A placeholder — `module-builder` extends it (login/logout mutations,
 * richer user shape) once the auth module's contract exists. Point it at
 * whatever "who am I" endpoint the backend exposes.
 */
export function useAuth() {
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => parseData(currentUserSchema, (await api.get("/auth/me")).data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: query.data ?? null,
    role: query.data?.role,
    isLoading: query.isLoading,
    isAuthenticated: Boolean(query.data),
  };
}
