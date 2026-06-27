import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Test runner config. No app source is touched by this file.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the "@/..." -> "src/..." alias the app uses (e.g. "@/lib/axios").
    alias: { "@": resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
