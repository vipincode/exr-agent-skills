import { waitFor } from "@testing-library/react";
import { http } from "msw";
import { describe, expect, it } from "vitest";

import { fail, ok, server } from "../../../test/msw";
import { renderHookWithProviders } from "../../../test/render";
import { useAuth } from "../use-auth";

// Query-hook example: real QueryClient + real axios (incl. the 401 → refresh
// interceptor) against MSW handlers that speak the backend's envelope.
describe("useAuth", () => {
  it("returns the validated current user", async () => {
    server.use(http.get("/api/auth/me", () => ok({ id: "1", email: "a@b.co", role: "admin" })));

    const { result } = renderHookWithProviders(() => useAuth());

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.role).toBe("admin");
  });

  it("stays signed out when the session and its refresh are both rejected", async () => {
    server.use(
      http.get("/api/auth/me", () => fail(401, "UNAUTHORIZED", "Authentication required")),
      http.post("/api/auth/refresh", () => fail(401, "UNAUTHORIZED", "Session expired")),
    );

    const { result } = renderHookWithProviders(() => useAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });
});
