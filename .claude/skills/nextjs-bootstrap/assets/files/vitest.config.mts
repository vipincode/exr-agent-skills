import { defineConfig } from "vitest/config";

// Unit + component tests (Vitest + React Testing Library + MSW). Tests live in
// `__tests__/` next to the code they cover and are named *.test.ts(x). The
// network is mocked with MSW (test/msw.ts), so tests run the real axios
// instance → envelope parsing → Zod chain against the backend's exact response
// shapes. Async Server Components aren't supported by Vitest — use E2E for those.
//
// No plugins needed on Vite 8: `resolve.tsconfigPaths` resolves the `@/` alias
// and Oxc compiles JSX. (@vitejs/plugin-react 6 would also drag in Babel 8,
// which conflicts with the Babel 7 that shadcn and eslint-plugin-react-hooks use.)
export default defineConfig({
  resolve: { tsconfigPaths: true },
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/__tests__/**", "src/components/ui/**", "src/app/**/layout.tsx"],
    },
  },
});
