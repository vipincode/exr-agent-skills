import { AxiosError } from "axios";
import { http } from "msw";
import { describe, expect, it } from "vitest";

import { api } from "@/lib/axios";

import { server, validationFailed } from "../../../../test/msw";
import { fieldErrors, toApiError } from "../errors";

// Network-level example: MSW returns the backend's exact error envelope and the
// real axios instance throws it — the same path a feature's request fn takes.
describe("toApiError", () => {
  it("normalizes the backend's error envelope", async () => {
    server.use(http.post("/api/products", () => validationFailed({ sku: "SKU already taken" })));

    const error = await api.post("/products", {}).catch((e: unknown) => e);
    const apiError = toApiError(error);

    expect(apiError).toMatchObject({ status: 400, code: "BAD_REQUEST", message: "Validation failed" });
    expect(fieldErrors(apiError.details)).toEqual({ sku: "SKU already taken" });
  });

  it("reports a network failure without a response", () => {
    expect(toApiError(new AxiosError("Network Error", "ERR_NETWORK")).code).toBe("NETWORK");
  });
});

describe("fieldErrors", () => {
  it("flattens nested treeified paths", () => {
    const details = { errors: [], properties: { items: { errors: [], items: [{ errors: ["Required"] }] } } };
    expect(fieldErrors(details)).toEqual({ "items.0": "Required" });
  });

  it("reads Mongoose's flat { path: message } details", () => {
    expect(fieldErrors({ sku: "Path `sku` is required." })).toEqual({ sku: "Path `sku` is required." });
  });
});
