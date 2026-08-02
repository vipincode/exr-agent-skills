"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../api/login";
import { AUTH_QUERY_KEY } from "../constants/auth";
import type { AuthSession, LoginInput } from "../types/auth";

/** See the session-storage gap noted in `use-register.ts` — same applies here. */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<AuthSession, unknown, LoginInput>({
    mutationFn: login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}
