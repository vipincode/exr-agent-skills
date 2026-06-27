# Review Summary — features/products/

**Type:** Read-only static code review (frontend-code-review skill). **No source files were modified.**
This review did not run the app or verify runtime behavior — it is static analysis against the project's ARCHITECTURE.md + MODULE_REGISTRY.md.

**Verdict:** Not production-ready — the products list binding bypasses the project's BFF/axios/Zod/Query standard.

## Key findings

- **Critical** — template/products-grid.tsx:11: client component fetches the backend directly via process.env.BACKEND_URL. That var is undefined in the browser (so the list never loads) and it bypasses the mandated same-origin /api BFF. Route through the shared api axios instance instead.
- **High** — server state via useEffect+useState instead of TanStack Query (useProductsQuery with key ["products", filters]).
- **High** — response consumed raw as any; no envelope unwrap + Zod validation (no schema/ or types/).
- **High** — no error/loading/empty states; failed fetch is an unhandled rejection → blank grid.
- **Medium** — binding crammed into template/; feature is missing its api/ hooks/ types/ schema/ layer.
- **Low** — raw <img> vs next/image; ad-hoc price string formatting.

## What's good

- ProductCard is clean and correctly design-only (real alt, stock shown via text + color, stable id key).
- All shared infra needed for the correct binding (axios /api, BFF catch-all, query client) already exists.

Full report: review.md.
