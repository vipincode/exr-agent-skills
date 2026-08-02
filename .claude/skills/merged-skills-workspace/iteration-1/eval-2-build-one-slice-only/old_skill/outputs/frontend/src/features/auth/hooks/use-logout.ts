"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../api/logout";
import { AUTH_QUERY_KEY } from "../constants/auth";

/**
 * Logout clears locally even if the request fails (plan: Edge cases & states) — hence
 * `onSettled` rather than `onSuccess` for the invalidation.
 *
 * Same flagged gap as `use-register.ts`: the shared `useAuth` has no `clearSession` yet, so the
 * local clear is limited to dropping the cached auth queries.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, void>({
    mutationFn: logout,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}
