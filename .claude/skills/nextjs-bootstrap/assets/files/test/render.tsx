import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

// Render helpers that wrap the subject in the app's providers. A fresh
// QueryClient per test, with retries off, so a failing request fails the test
// immediately instead of after retries — and no cache leaks between tests.

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return function Providers({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/** `render()` inside the app providers. */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: makeWrapper(), ...options });
}

/** `renderHook()` inside the app providers — for query/mutation hooks. */
export function renderHookWithProviders<T>(hook: () => T) {
  return renderHook(hook, { wrapper: makeWrapper() });
}
