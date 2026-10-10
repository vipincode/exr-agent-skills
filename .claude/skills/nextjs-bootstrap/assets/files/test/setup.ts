import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./msw";

// Loaded before every test file (vitest.config.mts → setupFiles). Unmocked
// requests fail loudly, so a test can never silently hit a real network.
// (MSW 3 renamed v2's `onUnhandledRequest` to `onUnhandledFrame`.)

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
