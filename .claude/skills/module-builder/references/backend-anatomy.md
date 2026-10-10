# Backend module anatomy

What each file in `src/modules/<name>/` contains, in build order. **ARCHITECTURE.md wins** wherever it differs — an onboarded project may use another layout, an Express 4 wrapper, or no repository layer; follow what its contract says. The rules below are the bootstrap defaults.

Authoring style (functions vs classes) for **repository, service, controller, routes** follows the paradigm section of ARCHITECTURE.md, which carries examples. Everything else — model, schema, mapper, `index.ts`, tests — is the same in every paradigm and shown below. These snippets compile against the bootstrap scaffold (Mongoose 9, Zod 4, Express 5, NodeNext `.js` imports).

## Edit scope for one slice

| May create/edit | Only when |
|---|---|
| `src/modules/<name>/**` (incl. `__tests__/`) | always — this is the slice's home |
| `src/routes.ts` | adding this module's single mount line (first slice of a new module) |
| `MODULE_REGISTRY.md` | always — module row, new shared pieces, decisions |
| `src/lib/`, `src/middleware/`, `src/types/`, `src/constants/` | the dedup gate decided a shared piece must be created or extended — name each in the hand-off |
| `src/config/env.ts` + `.env.example` | the slice adds an env var (both in the same change) |
| another module's files | **never**, unless the slice file explicitly lists the change — otherwise call its `index.ts` surface, and if that lacks what you need, stop and surface it |

## Layering (lint-enforced)

```
routes → controller → service → repository → model
                         ↘ mapper
```

Only `<name>.repository.ts` imports the model at runtime (type-only imports are fine). Controllers/routes never import the repository. Other modules import only `index.ts`. `lib/`/`middleware/`/`config/`/`types/`/`constants/` never import `modules/`. A lint error from `@typescript-eslint/no-restricted-imports` means the code is in the wrong layer — move it; never loosen the rule.

## `<name>.model.ts` — only if the module owns data

Schema shape, indexes, the doc type. No business logic; pre/post hooks are `async` functions (Mongoose 9 removed `next`) and never call other modules.

```ts
import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    priceCents: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true, unique: true },
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ProductDoc = InferSchemaType<typeof productSchema> & { _id: Types.ObjectId };
export const Product = model("Product", productSchema);
```

Declare every index the slice's queries need (`productSchema.index({ category: 1, createdAt: -1 })`). Sensitive fields (`passwordHash`) get `select: false` as defense in depth — the mapper is still the real guard.

## `<name>.schema.ts` — Zod inputs + per-route request bundles

```ts
import * as z from "zod";
import type { RequestSchemas } from "../../middleware/validate.js";
import { idParamsSchema } from "../../lib/common-schemas.js";
import { paginationQuerySchema } from "../../lib/pagination.js";

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  priceCents: z.number().int().min(0),
  sku: z.string().trim().min(1).max(64),
  inStock: z.boolean().optional(),
});
export const updateProductSchema = createProductSchema.partial();
export const listProductsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
});

export type CreateProductInput = z.output<typeof createProductSchema>;
export type UpdateProductInput = z.output<typeof updateProductSchema>;
export type ListProductsQuery = z.output<typeof listProductsQuerySchema>;

// One bundle per route — feeds validate() in routes AND ValidatedRequest<> in the controller.
export const createProductRequest = { body: createProductSchema } satisfies RequestSchemas;
export const getProductRequest = { params: idParamsSchema } satisfies RequestSchemas;
export const updateProductRequest = { params: idParamsSchema, body: updateProductSchema } satisfies RequestSchemas;
export const listProductsRequest = { query: listProductsQuerySchema } satisfies RequestSchemas;
```

- Reuse `idParamsSchema`/`objectIdSchema` and `paginationQuerySchema` — never a new ObjectId regex or page/limit pair.
- Fields a client must not set (`role`, `ownerId`, `isAdmin`) are simply absent; `z.object()` strips unknown keys. That is the mass-assignment guard.

## `<name>.repository.ts` — all data access

Every Mongoose call for the module. Returns **lean plain objects** (`.lean<XDoc>()`, or `doc.toObject()` after `create`). Lists use `findPage(filter, { skip, limit })` → `{ items, total }`. Updates use `{ returnDocument: "after", runValidators: true }`. No business rules, no `AppError`s (return `null`/`false`; the service decides what that means). Filter types use Mongoose 9's `QueryFilter<XDoc>`.

## `<name>.mapper.ts` — what may leave the API

```ts
import type { ProductDoc } from "./product.model.js";

export function toProductDto(doc: ProductDoc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    priceCents: doc.priceCents,
    sku: doc.sku,
    inStock: doc.inStock,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export type ProductDto = ReturnType<typeof toProductDto>;
```

The DTO must match the slice's **API contract** `data` shape exactly — this file is where the contract becomes code.

## `<name>.service.ts` — business rules

Calls its repository and other modules' public services; maps to DTOs; throws `AppError` subclasses (`NotFoundError`, `ConflictError`, `ForbiddenError` for ownership checks…). Builds query filters from validated fields only. No `req`/`res`. Paginated lists return `{ items, meta: toPageMeta(query, total) }`. Messages/limits/enums go in `<name>.constants.ts`.

## `<name>.controller.ts` — thin HTTP layer

`req: ValidatedRequest<typeof <route>Request>` → one service call → `ok(res, data, meta?)` / `created(res, data)` / `noContent(res)`. No try/catch, no logic. The user on a protected route comes from `getAuthUser(req)`, never `req.user!`.

## `<name>.routes.ts` — wiring

Default-exported `Router`. Each route: `validate(<route>Request)` → `protect` → `requireRole(...)` (if needed) → handler. Validation first rejects malformed input cheaply; auth next; handler last.

## `<name>.container.ts` — only for class-based services

Where class instances are constructed (OOP paradigm, or a hybrid class service). Routes/controllers import instances from here; never construct services in routes or controllers.

## `index.ts` — the public API

```ts
export { default as productRoutes } from "./product.routes.js";
export { getProductById } from "./product.service.js";  // only what other modules may call
export type { ProductDto } from "./product.mapper.js";
```

Never export the model or repository. When a later slice exposes a new service function to other modules, add it here and to the module's registry row.

## Mounting — `src/routes.ts`

First slice of a new module adds one line between the markers, alphabetical:

```ts
import { productRoutes } from "./modules/product/index.js";
// --- Module routes: ...
apiRouter.use("/products", productRoutes);
```

Full path = `/api/v1` + mount + route path. `app.ts` is never edited.

## `<name>.types.ts` / `.constants.ts` / `.utils.ts` — optional, module-local

Non-schema types; named constants and enums (no magic literals); private helpers. The moment a second module needs one, it moves to `src/types/`, `src/constants/`, or `src/lib/` and gets registered — never copied.

## `__tests__/` — owned by test-writer

module-builder does not write tests (test-writer does, on request), but it keeps code testable: services depend only on the repository and other modules' public surfaces, so `vi.mock("../<name>.repository.js")` is all a unit test needs. Conventions test-writer follows: `<name>.service.test.ts` (unit) and `<name>.routes.int.test.ts` (integration via `test/helpers.ts`).
