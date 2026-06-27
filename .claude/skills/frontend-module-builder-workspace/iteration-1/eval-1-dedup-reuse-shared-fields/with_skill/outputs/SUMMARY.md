# SUMMARY — products-create binding

Built the admin **create-product** API binding from `_docs/FEATURE_PLAN_products-create.md`,
wiring the form to `POST /api/products` through the existing BFF proxy. Plan status was NOT blocked
(API contract fully observed), so the build proceeded; the two flagged gaps (`useAuth` stub, missing
form component) are handled per the plan and noted below.

## What I did
- Created the products feature **binding layer** (types, Zod schemas, axios request fn, TanStack mutation hook).
- Filled the **design gap** by composing a lightweight create form **from the shared `*Field` components** (not new field UI).
- Added the admin **template** (role gate + mutation wiring + server-error mapping + success redirect) and the **route**.
- Updated `MODULE_REGISTRY.md` (feature surface, route, decisions log).
- Did NOT run install/build/typecheck — no `node_modules` per instructions. Code is written to compile; see Verification.

## Files created (relative to `frontend/`)
| File | Purpose |
|---|---|
| `src/features/products/schema/products.schema.ts` | Zod: `productSchema`, `createProductEnvelopeSchema`, `productListSchema`, `createProductInput` (form) |
| `src/features/products/types/products.ts` | `Product`, `ProductListResponse`, `CreateProductInput` — all via `z.infer` (no parallel interfaces) |
| `src/features/products/api/products.api.ts` | `createProduct(input)` -> `api.post("/products", body)`; dollars->cents map; unwrap + Zod-validate `data` |
| `src/features/products/hooks/use-products.ts` | `useCreateProductMutation()` — invalidates `["products"]` on success |
| `src/features/products/components/product-form.tsx` | NEW RHF form composed from shared `InputField`/`SelectField`/`CheckboxField` |
| `src/features/products/template/product-create.tsx` | Admin screen: `useAuth` gate, mutation, 409/422/401 mapping, reset+redirect |
| `src/features/products/index.ts` | Barrel — public surface |
| `src/app/admin/products/new/page.tsx` | Admin route rendering `ProductCreate` |

## Files modified (relative to `frontend/`)
| File | Change |
|---|---|
| `MODULE_REGISTRY.md` | products feature row updated (now bound); added Routes table + Decisions log |

## REUSED existing code (the dedup gate worked) — NOT recreated
| Reused | Path | How |
|---|---|---|
| **InputField** | `src/components/shared/form/input-field.tsx` (via barrel `@/components/shared/form`) | `name`, `price`, `category`, `imageUrl` fields |
| **SelectField** | `src/components/shared/form/select-field.tsx` (via barrel) | `currency` field |
| **CheckboxField** | `src/components/shared/form/checkbox-field.tsx` (via barrel) | `inStock` toggle |
| axios `api` instance | `src/lib/axios.ts` | request fn (`baseURL: /api`) — no new instance, no absolute backend URL |
| BFF catch-all proxy | `src/app/api/[...path]/route.ts` | forwards `POST /api/products`; no per-feature BFF route added |
| query client / TanStack context | `src/lib/query-client.ts` (registry) | `useMutation` / `invalidateQueries` |
| `useAuth` | `src/hooks/use-auth.ts` | admin role gate (stub today — see Dependencies) |
| `ProductCard` / `ProductsGrid` | `src/features/products/...` | left unchanged; new product appears via `["products"]` invalidation |

**Field UI was REUSED, not rebuilt.** The shared `*Field` source is elided in this fixture but is
exported through `src/components/shared/form/index.ts`; I imported them via the `@/components/shared/form`
barrel. No `input-field.tsx`/`select-field.tsx`/`checkbox-field.tsx` and no raw `<input>` + `useController`
were created — `product-form.tsx` only composes the existing fields and adds RHF + submit wiring.

## Created new (with rationale)
- `product-form.tsx` — the plan's explicit **design gap** (no create form existed). Built as a lightweight
  composition of the shared fields so the binding is functional; it is feature-local (depends on the
  products schema/types), registered as part of the feature's public surface, not as a new shared component.

## Conventions honored
- **BFF only** — browser -> `/api/products` -> catch-all proxy -> backend. No direct backend URL.
- **Envelope unwrap + Zod parse** — `createProductEnvelopeSchema.parse(res.data).data` (drift fails loudly).
- **Types from Zod** — every type via `z.infer`.
- **TanStack Query v5** — array key `["products"]`, invalidate-on-success.
- **Forms via shared `*Field`** — `useForm({ resolver: zodResolver(createProductInput) })` inside `<FormProvider>`.
- **Price units** — form collects dollars; binding converts to positive integer cents (`Math.round(x*100)`); `slug`/`id` never sent.

## Verification
Not run — there is no `node_modules` and instructions said not to install/build/typecheck. Code is
written to compile against the documented stack (Next.js App Router, RHF 7 + `@hookform/resolvers/zod`,
Zod 4, TanStack Query v5, axios). No typecheck was executed, so this is "written to compile," not "verified green."

## Open items carried from the plan (not invented here)
- **`useAuth` is a stub** (`{ user: null }`) -> the admin gate hides the form and the guarded POST has no token (401) until a real session/role is wired. Dependency, owned elsewhere.
- **422 per-field mapping** — observed error envelope (`{ success, message, code }`) carries no field details, so 422 surfaces at the form root (409 -> `name`). If the backend later returns field details, refine `handleSubmit`.
- **Success toast** — no toast infra in the registry; left a `TODO(toast)` and did reset + redirect. Adding toast infra is out of this binding's scope.
- **List binding** for `ProductsGrid` remains TODO (still renders hardcoded `SAMPLE`) — separate plan.
- Tests are a separate, optional step (`frontend-test-writer`) — not written here.
