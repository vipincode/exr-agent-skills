import { describe, expect, it } from "vitest";
import { api } from "../../../../test/helpers.js";

// Integration test (real app + in-memory Mongo via test/setup-db.ts): the
// canonical example for `<name>.routes.int.test.ts`. Asserts the real status
// codes and the real envelope, end to end through the middleware stack.
describe("GET /api/v1/health", () => {
  it("returns the success envelope with a connected database", async () => {
    const res = await api().get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { status: "ok", db: "connected" },
    });
  });

  it("renders unknown routes through the error envelope", async () => {
    const res = await api().get("/api/v1/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: "NOT_FOUND" } });
  });
});
