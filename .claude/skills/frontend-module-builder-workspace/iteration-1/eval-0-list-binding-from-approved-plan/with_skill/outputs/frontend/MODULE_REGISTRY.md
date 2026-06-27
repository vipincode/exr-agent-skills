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
| products | src/features/products | components/ (ProductCard), template/ (ProductsGrid), schema/, types/, api/, hooks/, lib/ | List binding DONE. Public surface: `useProductsQuery(filters?)`, `ProductsGrid`, types `Product`/`ProductListResponse`/`ProductFilters`. Bound to GET /api/products (paged, public) via TanStack Query + Zod-validated envelope. Detail/create endpoints still unbound (out of scope). |

## Decisions log
- products list is **paged** via `page`/`limit`; binds first page only (default `limit` 20) — no pager UI yet (design gap).
- `price` is stored as integer **cents** + a separate `currency`; formatted at the edge via `formatPrice(cents, currency)` (feature-local `lib/format-price.ts`, `Intl.NumberFormat`). `ProductCard` receives a pre-formatted `price` string and stays unchanged.
- GET /api/products response is unwrapped (`data`) and validated with `productsEnvelopeSchema` so contract drift fails loudly.
- Query key convention: `["products", filters]`. `search`/`category` filters supported by the hook signature but not yet wired to UI.
