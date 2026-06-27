# Test Summary — Create Product Form

## Target
`frontend/src/features/products/template/product-form.tsx` — the admin-only
`<ProductForm />` (RHF + Zod + a `useCreateProductMutation` TanStack Query mutation).

## Files written
| File | Purpose |
|---|---|
| `frontend/src/features/products/template/product-form.test.tsx` | The test suite |
| `frontend/vitest.config.ts` | Vitest config (jsdom env, `@` -> `src` alias, react plugin, globals, setup file) |
| `frontend/vitest.setup.ts` | Registers `@testing-library/jest-dom` matchers |

No vitest config or setup existed in the repo, so they were added. **No source files were modified.**

## Framework & tooling
- **Vitest 2** as the runner, `environment: "jsdom"`.
- **@testing-library/react 16** for rendering/queries, **@testing-library/user-event 14** for interaction.
- **@testing-library/jest-dom** matchers via `vitest.setup.ts`.
- `@vitejs/plugin-react` so JSX/TSX (incl. inside the mock factory) transforms with the automatic runtime.

## Mocking approach
This is a pure component test — no network, no `QueryClient`, no real axios.

- **`@/components/shared/form`** is mocked. The concrete `*Field` components only exist as
  a re-export barrel (`index.ts` points at files that aren't implemented in this repo slice),
  and they're out of scope for this form's behavior. The mock renders native `<input>`/`<select>`
  wired into the **real** react-hook-form context via `useFormContext().register`, so RHF +
  `zodResolver(createProductSchema)` validation runs for real (including `valueAsNumber` coercion
  on the price field).
- **`@/hooks/use-auth`** is mocked to drive the admin gate (`user?.role !== "admin"` -> renders `null`).
- **`../hooks/use-products`** is mocked so `useCreateProductMutation` returns a controllable stub
  (`mutate` spy + `isError` / `isPending` flags). This lets us assert the exact submitted payload
  and exercise pending/error UI without TanStack Query.

Shared mutable mock state is created with `vi.hoisted(...)` and reset in `beforeEach`.

## What is covered
**Admin gating**
- Renders nothing for a `null` user.
- Renders nothing for a logged-in non-admin (`role: "customer"`).
- Renders all fields + Create button for an admin.

**Submission**
- Valid input calls `mutate` exactly once with the field values merged with schema/form
  defaults (`currency: "USD"`, `inStock: true`).
- The price field is coerced to a `number`.

**Validation blocks submit**
- Empty form does not call `mutate`.
- Name-only (price still 0, not positive) does not call `mutate`.

**Mutation states**
- `isError` shows the `role="alert"` error message.
- Idle state shows no alert.
- `isPending` disables the Create button; otherwise it is enabled.

## How to run
From the `frontend/` directory (after `npm install`, intentionally skipped here):

```bash
npm test            # vitest run (one-shot)
npm run test:watch  # watch mode
```

Or target just this file: `npx vitest run src/features/products/template/product-form.test.tsx`.
