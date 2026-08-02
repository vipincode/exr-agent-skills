"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { register } from "../api/register";
import { AUTH_QUERY_KEY } from "../constants/auth";
import type { AuthSession, RegisterInput } from "../types/auth";

/**
 * FLAGGED GAP — session storage: the plan says the mutation should "store the session via
 * useAuth", but the shared `useAuth` (src/hooks/use-auth.ts) is currently a read-only accessor
 * with no `setSession`. Extending that shared hook into a session store is outside this plan's
 * scope, so the mutation invalidates the auth keys and hands the session back to the caller.
 * Once `useAuth` exposes a setter, call it in `onSuccess`.
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation<AuthSession, unknown, RegisterInput>({
    mutationFn: register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}
