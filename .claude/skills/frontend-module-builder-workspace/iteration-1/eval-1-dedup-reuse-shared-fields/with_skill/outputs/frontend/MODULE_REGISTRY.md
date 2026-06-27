# Module Registry — demo-web (frontend)
Check here FIRST before creating any component/hook/util/type.

## Shared form fields (src/components/shared/form/)
| Name | Path |
|---|---|
| InputField | components/shared/form/input-field.tsx |
| SelectField | components/shared/form/select-field.tsx |
| TextareaField | components/shared/form/textarea-field.tsx |
| CheckboxField | components/shared/form/checkbox-field.tsx |

## Shared library (src/lib/)
| Name | Path | Purpose |
|---|---|---|
| api (axios) | lib/axios.ts | one axios, baseURL /api |
| queryClient | lib/query-client.ts | single TanStack QueryClient |

## App infrastructure
| Name | Path | Purpose |
|---|---|---|
| BFF proxy | app/api/[...path]/route.ts | forwards /api/* to backend |

## Hooks (src/hooks/)
| Name | Path | Purpose |
|---|---|---|
| useAuth | hooks/use-auth.ts | current user/role accessor |

## Features (src/features/)
| Feature | Path | Owns | Notes |
|---|---|---|---|
| products | src/features/products | types/, schema/, api/, hooks/, components/ (product-card, product-form), template/ (products-grid, product-create) | CREATE bound to `POST /api/products`. Public surface: `useCreateProductMutation`, `createProduct`, `ProductCreate`, `ProductForm`, `productSchema`/`createProductInput`/`createProductEnvelopeSchema`, types `Product`/`CreateProductInput`/`ProductListResponse`. Grid list binding still TODO (renders hardcoded SAMPLE). |

## Routes (src/app/)
| Route | Path | Renders | Notes |
|---|---|---|---|
| /admin/products/new | app/admin/products/new/page.tsx | `ProductCreate` template | admin-only create-product form |

## Decisions log
- Products **create** binds to `POST /api/products` through the BFF catch-all proxy (no per-feature BFF route). Success envelope `{ success, data, message }` is unwrapped and `data` validated with `productSchema`.
- Price is stored in **cents** (positive integer) on the backend; the form collects **dollars** and the binding converts (`dollars * 100`, rounded) at the edge. `slug`/`id` are server-derived and never submitted.
- Cache strategy: invalidate-on-success (`["products"]`) — no optimistic update for the paged grid.
- Server-error mapping: 409 → `name` field ("name already exists"), 422 → form root (observed envelope has no per-field details), 401 → redirect to `/login`, other → top-level banner.
- Admin gating via `useAuth().user?.role === "admin"` in the UI (backend `requireRole("admin")` is the real enforcement). `useAuth` is still a stub returning `null` — form is hidden until real session/role is wired.
