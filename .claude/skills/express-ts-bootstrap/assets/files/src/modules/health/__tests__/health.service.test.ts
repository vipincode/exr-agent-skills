import { describe, expect, it } from "vitest";
import { getHealth } from "../health.service.js";

// Unit test (no database): the canonical example for `<name>.service.test.ts`.
describe("getHealth", () => {
  it("reports ok with uptime and an ISO timestamp", () => {
    const health = getHealth();

    expect(health.status).toBe("ok");
    expect(health.uptime).toBeGreaterThanOrEqual(0);
    expect(new Date(health.timestamp).toISOString()).toBe(health.timestamp);
  });

  it("reports the database as disconnected when no connection is open", () => {
    expect(getHealth().db).toBe("disconnected");
  });
});
