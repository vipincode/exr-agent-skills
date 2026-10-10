import { describe, expect, it } from "vitest";
import * as z from "zod";

import { parseData, parsePaginated } from "../envelope";

// Unit test (no DOM, no network): the canonical example for pure helpers.
const productSchema = z.object({ id: z.string(), name: z.string() });

describe("envelope helpers", () => {
  it("parseData unwraps { success, data }", () => {
    expect(parseData(productSchema, { success: true, data: { id: "1", name: "Lamp" } })).toEqual({
      id: "1",
      name: "Lamp",
    });
  });

  it("parsePaginated returns { items, meta }", () => {
    const meta = { page: 1, limit: 20, total: 1, totalPages: 1 };
    expect(parsePaginated(productSchema, { success: true, data: [{ id: "1", name: "Lamp" }], meta })).toEqual({
      items: [{ id: "1", name: "Lamp" }],
      meta,
    });
  });

  it("throws when the response drifts from the contract", () => {
    expect(() => parsePaginated(productSchema, { success: true, data: [{ id: 1 }] })).toThrow(z.ZodError);
  });
});
