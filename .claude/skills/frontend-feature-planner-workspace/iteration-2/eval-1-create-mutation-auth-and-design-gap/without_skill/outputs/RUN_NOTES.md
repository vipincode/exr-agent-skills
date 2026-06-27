# RUN NOTES — eval-1 (without_skill)

Task: "I want an admin-only create product form wired up to the backend. Plan it." — planning only.

## Approach
1. Read `.claude/workspace.json` to confirm the monorepo layout (backend = express-ts, frontend = nextjs).
2. Read the **real backend** as ground truth instead of guessing a contract:
   - `products.routes.ts` → `POST /api/products` is `protect` + `requireRole("admin")` + `validate(createProductBody)`.
   - `products.schema.ts` → exact body fields/rules (price in CENTS, currency len 3 default USD, imageUrl url-optional, slug NOT in body).
   - `products.service.ts` → server derives `slug` (unique → duplicate name = 409); success DTO shape.
   - `app-response.ts` + `ARCHITECTURE.md` → success envelope `{success,data,message}` and error envelope `{success,message,code}` with 422/401/409.
3. Read the **frontend** to find what exists vs. what's missing:
   - `MODULE_REGISTRY.md`/source → `products` is DESIGN ONLY (card + grid w/ hardcoded SAMPLE), no api/hooks/types/schema, and **no create-form component**.
   - Shared form fields = Input/Select/Textarea/Checkbox (no NumberField). `useAuth` is a stub returning null. BFF catch-all proxy + shared axios already cover `/api/*`.
4. Wrote `FEATURE_PLAN_product-create.md` (contract, gaps, files-to-create, data-binding map, admin gating, open questions). No binding code written.

## Key conclusions
- **No new transport plumbing**: catch-all BFF proxy + `lib/axios.ts` (`baseURL:/api`) cover `POST /products`; just unwrap `res.data.data`.
- **Net-new frontend binding layer** needed: `types/ schema/ api/ hooks/` for products (none exist yet) + invalidate `["products"]` on success.
- **Design gap**: the create form does not exist — must be built; plan specifies the exact fields/components for the builder.
- **Two contract mismatches to bridge**:
  1. price is shown as a string ("$24.00") in the card but the API wants **integer cents** → collect dollars, `round(*100)` on submit.
  2. No `NumberField` → use `InputField type="number"` (or add a shared field).
- **Admin-only = defense in depth**: UI gate via `useAuth().user.role === "admin"` (currently STUBBED — prerequisite), server already authoritative (401 otherwise).
- **Error handling**: surface 422 (field errors), 401 (sign-in/admin), **409 duplicate name/slug** on the form.
- **Open dependency**: how auth token/cookie reaches the backend `protect` — must confirm before the mutation can succeed.

## Deliverables in this folder
- `FEATURE_PLAN_product-create.md` — the plan.
- `RUN_NOTES.md` — this file.
