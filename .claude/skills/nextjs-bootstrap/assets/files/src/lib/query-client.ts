import { QueryClient } from "@tanstack/react-query";

/**
 * Single QueryClient factory. `app/providers.tsx` constructs one per browser
 * session. Defaults err toward fewer surprise refetches; tune per app.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 min — avoids refetch storms on navigation
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
