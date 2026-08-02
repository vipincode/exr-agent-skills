"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { register } from "../api/register";
import { AUTH_QUERY_KEYS } from "../constants/auth";
import type { RegisterData, RegisterRequest } from "../schema/register.schema";

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const { setSession } = useAuth();

  return useMutation<RegisterData, unknown, RegisterRequest>({
    mutationFn: register,
    onSuccess: (data) => {
      setSession({ user: data.user, token: data.token });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.session });
    },
  });
}
