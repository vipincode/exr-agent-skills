# FEATURE_PLAN template (frontend API binding)

Write to `_docs/FEATURE_PLAN_<name>.md` under the frontend project dir (create `_docs/` if
needed). Use this structure verbatim. Keep it scannable — the user edits this by hand before
`frontend-module-builder` executes it.

```markdown
# Feature plan: <name> (API binding)

> Status: draft — edit freely, then hand to frontend-module-builder. Add/remove any section.

## Overview
One or two sentences: which design/screen this binds, to which API capability, and the goal
(make the <name> design functional against the backend).

## API contract (observed)
> Source: <rung used — e.g. monorepo backend src/modules/products, or openapi.json, or pasted>

**Success envelope:** `{ success: true, data: <shape>, message?: string }`  ← exact, from source
**Error envelope:** `{ success: false, message, code? }` — statuses: 401 / 404 / 409 / 422 …

| Method | Path | Auth | Request (params / query / body) | Response `data` shape |
|--------|------|------|--------------------------------|------------------------|
| GET | /products | public | query: page, limit, search? | `{ items: Product[], total, page, limit }` |
| GET | /products/:id | public | params: id | `Product` |
| POST | /products | requireRole('admin') | body: name, price, … | `Product` |

`Product` = { id, name, price, ... }  ← field types from the model/service/sample.

## Decisions
- <decision>: <chosen value>
- _Assumption_: <anything inferred rather than confirmed — correct me if wrong>

## Reuse (do NOT recreate)
| What | Path | How it's used here |
|------|------|--------------------|
| axios instance | src/lib/axios.ts | all request fns go through it (baseURL /api) |
| BFF proxy | src/app/api/[...path]/route.ts | catch-all already forwards /api/products → backend |
| query client | src/lib/query-client.ts | provided in app/providers.tsx |
| InputField / SelectField / … | src/components/shared/form/* | the create/edit form fields |
| useAuth | src/hooks/use-auth.ts | gate admin-only mutations in the UI |
| <existing component/feature piece> | <path> | <usage> |

## Types & schema
- `src/features/<name>/types/<name>.ts` — `Product`, list-response type (mirror the envelope `data`).
- `src/features/<name>/schema/<name>.schema.ts` — Zod input schemas (create/update/filters);
  types via `z.infer`. No parallel interfaces.

## Create
| File | Purpose |
|------|---------|
| src/features/<name>/types/<name>.ts | domain types from the observed `data` shape |
| src/features/<name>/schema/<name>.schema.ts | Zod request/form schemas |
| src/features/<name>/api/<name>.api.ts | request fns hitting /api/<name> via axios |
| src/features/<name>/hooks/use-<name>.ts | TanStack query/mutation hooks |
| src/features/<name>/components/*.tsx | feature-only components (if any new) |
| src/features/<name>/template/<name>-*.tsx | composed screen(s), rendered by page.tsx |
| src/features/<name>/index.ts | barrel for the module's public surface |
| src/app/api/<name>/route.ts | BFF route — ONLY if catch-all proxy is insufficient; else omit |

## Data-binding map
| Component (path) | Hook | Fields bound | States |
|------------------|------|--------------|--------|
| features/<name>/components/product-card.tsx | useProductsQuery | name, price, image | loading skeleton / empty |
| features/<name>/template/product-form.tsx | useCreateProductMutation | name, price → POST body | submit/disabled/error |

## Query/mutation hooks
- `useProductsQuery(filters)` — key `["products", filters]`; pagination via …
- `useCreateProductMutation()` — on success invalidates `["products"]`; <optimistic? confirm?>
- loading / empty / error handling per hook.

## Design gaps (build before/with binding)
Components the binding needs that aren't built yet → figma-to-component / html-to-component.
(or "none — design is complete".)

## Edge cases & states
- loading, empty list, request error (toast/inline), 401 → re-auth, end-of-pagination,
  optimistic rollback, duplicate/conflict (409) on create.

## Out of scope
What this binding deliberately excludes.

## Open questions
Anything still undecided — including data gaps (fields the design wants that the API lacks, or
actions with no endpoint) for the user to resolve before building.
```
