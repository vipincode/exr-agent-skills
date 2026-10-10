# Backend test patterns

Patterns per layer. Examples use Vitest and the bootstrap conventions (they run green against the scaffold); translate to Jest if that's what's installed (`vi` → `jest`, same structure). Match the project's import-extension convention. **ARCHITECTURE.md wins** — an onboarded project may have no repository layer (then mock the model) or a different test layout.

## Where tests go (bootstrap layout)

```
src/modules/<name>/__tests__/
  <name>.service.test.ts       # unit project — repository mocked, no DB
  <name>.mapper.test.ts        # unit — optional, when the mapper has logic
  <name>.routes.int.test.ts    # integration project — real app + in-memory Mongo
test/helpers.ts                # api(), authHeader(role) — reuse, never re-create
test/setup-db.ts               # in-memory Mongo lifecycle, auto-loaded for *.int.test.ts
```

The `.int.test.ts` suffix is what routes a file to the integration project (`vitest.config.ts`). A route test without it runs with no database and fails confusingly. Run with `<pm> run test:unit` / `test:int` / `test`.

## Service (unit) — mock the repository

The repository is the service's only data collaborator, so mocking it is a one-liner and the test stays about business rules. Assert the returned **DTO** on success and the specific `AppError` on failure. For a functional repository:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import { NotFoundError } from "../../../lib/app-error.js";
import * as productRepository from "../product.repository.js";
import { getProductById, listProducts } from "../product.service.js";
import type { ProductDoc } from "../product.model.js";

vi.mock("../product.repository.js");

const doc = (over: Partial<ProductDoc> = {}): ProductDoc => ({
  _id: new Types.ObjectId(),
  name: "Lamp",
  priceCents: 1999,
  sku: "LAMP-1",
  inStock: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  ...over,
});

describe("product.service", () => {
  beforeEach(() => vi.resetAllMocks());

  it("getProductById returns the mapped DTO", async () => {
    const found = doc();
    vi.mocked(productRepository.findById).mockResolvedValue(found);

    await expect(getProductById(found._id.toString())).resolves.toEqual({
      id: found._id.toString(),
      name: "Lamp",
      priceCents: 1999,
      sku: "LAMP-1",
      inStock: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("getProductById throws NotFoundError when missing", async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(null);
    await expect(getProductById("x")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("listProducts paginates and escapes the search term", async () => {
    vi.mocked(productRepository.findPage).mockResolvedValue({ items: [doc()], total: 41 });

    const result = await listProducts({ page: 3, limit: 20, search: "a.b" });

    expect(productRepository.findPage).toHaveBeenCalledWith(
      { name: { $regex: "a\\.b", $options: "i" } },
      { skip: 40, limit: 20 },
    );
    expect(result.meta).toEqual({ page: 3, limit: 20, total: 41, totalPages: 3 });
  });
});
```

- **Class service** (OOP/hybrid): construct it with a fake — `new ProductService({ findById: vi.fn() } as unknown as ProductRepository)` — that's the payoff of constructor injection.
- **Cross-module calls**: mock the other module's `index.js` (`vi.mock("../../user/index.js")`), the same surface the service imports — never its repository or model.
- Assert the DTO has **no** internal fields when the mapper is the guard for something sensitive (`expect(dto).not.toHaveProperty("passwordHash")`).

## Controller — usually covered by integration

Controllers are one service call plus an envelope helper, so a route integration test covers them with less mocking. Write a controller unit test only if a controller does something non-trivial (shouldn't happen under the contract — flag it). If you do:

```ts
import { expect, it, vi } from "vitest";
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

## Routes (integration) — real stack, in-memory Mongo

Exercise the real middleware chain (validation, auth, error handler, normalizeDbError) end to end through `api()`. `test/setup-db.ts` already connects an in-memory Mongo and empties collections between tests — don't add your own `MongoMemoryServer` setup. Mint tokens with `authHeader(role)`.

```ts
import { describe, expect, it } from "vitest";
import { api, authHeader } from "../../../../test/helpers.js";

const body = { name: "Lamp", priceCents: 1999, sku: "LAMP-1" };

describe("/api/v1/products", () => {
  it("creates as admin (201) and never leaks internal fields", async () => {
    const res = await api().post("/api/v1/products").set(await authHeader("admin")).send(body);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: "Lamp", inStock: true });
    expect(res.body.data).not.toHaveProperty("_id");
    expect(res.body.data).not.toHaveProperty("__v");
  });

  it("401 without a token, 401 with a garbage token, 403 for the wrong role", async () => {
    expect((await api().post("/api/v1/products").send(body)).status).toBe(401);
    const bad = await api().post("/api/v1/products").set({ Authorization: "Bearer nope" }).send(body);
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe("UNAUTHORIZED");
    expect((await api().post("/api/v1/products").set(await authHeader("user")).send(body)).status).toBe(403);
  });

  it("400 with details on invalid body; 409 on duplicate key", async () => {
    const admin = await authHeader("admin");
    const invalid = await api().post("/api/v1/products").set(admin).send({ name: "" });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe("BAD_REQUEST");
    expect(invalid.body.error.details).toBeDefined();

    await api().post("/api/v1/products").set(admin).send(body);
    expect((await api().post("/api/v1/products").set(admin).send(body)).status).toBe(409);
  });

  it("paginates, caps limit, and validates ids", async () => {
    await api().post("/api/v1/products").set(await authHeader("admin")).send(body);

    const list = await api().get("/api/v1/products?page=1&limit=10");
    expect(list.body.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    expect((await api().get("/api/v1/products?limit=1000")).status).toBe(400);
    expect((await api().get("/api/v1/products/not-an-id")).status).toBe(400);
    expect((await api().get("/api/v1/products/000000000000000000000000")).status).toBe(404);
  });
});
```

Seed data through the API (as above) or the module's own repository — not another module's model.

## What to assert (envelope-aware)

- Success: `{ success: true, data }`, correct status (200/201/204); lists also `meta = { page, limit, total, totalPages }`.
- Error: `{ success: false, error: { code, message } }`, status mapped from the `AppError` subclass.
- Validation failure: 400 + `BAD_REQUEST` + `details` present.
- Guarded routes: 401 without token, 401 with an invalid token, 403 with the wrong role.
- Ownership (when the slice has it): user A gets 403/404 on user B's resource.
- Responses never include `_id`, `__v`, or sensitive fields.
