import { defineConfig } from "vitest/config";

// Two projects so unit tests never pay for a database:
//   unit        → src/**/__tests__/*.test.ts      (collaborators mocked, no Mongo)
//   integration → src/**/__tests__/*.int.test.ts  (real app via supertest + in-memory Mongo)
// `env` is applied before any module loads, so config/env.ts validates test values
// instead of exiting. MONGODB_URI is a placeholder — integration tests connect to
// the in-memory server from test/setup-db.ts, never to it.
export default defineConfig({
  test: {
    environment: "node",
    clearMocks: true,
    restoreMocks: true,
    env: {
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://127.0.0.1:27017/unused-in-tests",
      JWT_SECRET: "test-only-secret-that-is-at-least-32-chars",
      LOG_LEVEL: "silent",
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.int.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["src/**/*.int.test.ts"],
          setupFiles: ["./test/setup-db.ts"],
          hookTimeout: 60_000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts", "src/types/**", "src/**/__tests__/**"],
    },
  },
});
