# Test patterns

Patterns per layer. Examples use Vitest; translate to Jest if that's what's installed (`vi` → `jest`, same structure). Match the project's import-extension convention.

## Service (unit) — mock the model / collaborators

Test business rules in isolation. Assert returned data on success and the specific `AppError` on failure.

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Product } from "../product.model.js";
import { getProductById } from "../product.service.js";
import { NotFoundError } from "../../../lib/app-error.js";

vi.mock("../product.model.js");

describe("getProductById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the product when found", async () => {
    vi.mocked(Product.findById).mockResolvedValue({ id: "1", name: "x" } as never);
    await expect(getProductById("1")).resolves.toMatchObject({ name: "x" });
  });

  it("throws NotFoundError when missing", async () => {
    vi.mocked(Product.findById).mockResolvedValue(null as never);
    await expect(getProductById("1")).rejects.toBeInstanceOf(NotFoundError);
  });
});
```

For a class service (OOP/hybrid), instantiate with mocked collaborators passed to the constructor — that's the payoff of constructor injection.

## Controller — mock the service, assert the envelope

```ts
import { describe, it, expect, vi } from "vitest";
import * as service from "../product.service.js";
import { getOne } from "../product.controller.js";

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

it("responds with the success envelope", async () => {
  vi.spyOn(service, "getProductById").mockResolvedValue({ id: "1" } as never);
  const res = mockRes();
  await getOne({ params: { id: "1" } } as any, res);
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "1" } });
});
```

## Routes / integration — supertest + in-memory Mongo

Exercise the real middleware stack (validation, auth, error handler) end to end. Assert real status codes and the envelope, including error codes.

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { createApp } from "../../../app.js";

let mongod: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

it("404s unknown routes with the error envelope", async () => {
  const res = await request(app).get("/nope");
  expect(res.status).toBe(404);
  expect(res.body).toMatchObject({ success: false, error: { code: "NOT_FOUND" } });
});

it("rejects unauthenticated access with 401", async () => {
  const res = await request(app).post("/products").send({ name: "x" });
  expect(res.status).toBe(401);
  expect(res.body.error.code).toBe("UNAUTHORIZED");
});
```

Integration deps (`supertest`, `mongodb-memory-server`) are devDependencies — note if they need installing. For auth-guarded routes, mint a token with the project's `signAccessToken` rather than hand-crafting a JWT.

## What to assert (envelope-aware)
- Success: `{ success: true, data: ... }`, correct status (200/201/204).
- Error: `{ success: false, error: { code, message } }`, correct status mapped from the `AppError` subclass.
- Validation failure: 400 + `code: "BAD_REQUEST"` + `details` present.
- Guarded routes: 401 without token, 403 with wrong role.
