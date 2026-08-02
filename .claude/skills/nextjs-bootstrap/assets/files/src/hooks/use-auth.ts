"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/axios";

export interface CurrentUser {
  id: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

/**
 * Current-user accessor. Hits the BFF (`/api/auth/me`), which forwards to the
 * backend with the httpOnly cookie attached. This is a placeholder the
 * `module-builder` extends this (login/logout mutations, richer user shape).
 *
 * Point it at whatever "who am I" endpoint your backend exposes.
 */
export function useAuth() {
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await api.get<{ user: CurrentUser }>("/auth/me");
      return data.user;
    },
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
