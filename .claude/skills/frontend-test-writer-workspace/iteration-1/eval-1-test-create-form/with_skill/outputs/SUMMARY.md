# Test summary — create-product form

Target: `frontend/src/features/products/template/product-form.tsx` (the admin-only `ProductForm`).

## Test file
- `frontend/src/features/products/template/product-form.test.tsx` (colocated, matching the repo's `@/` convention)

Plus test infrastructure that did not previously exist (the project had Vitest + RTL in
`package.json` but no config/setup):
- `frontend/vitest.config.ts` — jsdom env, globals, React plugin, and the `@ -> src` alias
  (the app has no tsconfig path-mapping wired for Vitest, so the alias is resolved here).
- `frontend/vitest.setup.ts` — registers `@testing-library/jest-dom` matchers and auto-cleans the DOM.

## What is covered
- **Auth gating** (`useAuth`): renders nothing for an unauthenticated user and for a non-admin
  (`role: "user"`); renders the full form only for `role: "admin"`.
- **Validation** (Zod via `zodResolver`): empty submit is blocked and surfaces the schema messages
  ("Name is required", "Price must be greater than 0", "Category is required") and the mutation is
  NOT called; a non-positive price (default 0) is rejected.
- **Submit body**: a valid fill calls the mutation exactly once with the validated body —
  `{ name: "Aero Mug", price: 2400 (number), category: "drinkware", currency: "USD", inStock: true }`.
  Asserting `price` is a number proves number coercion (`valueAsNumber`) and that the schema/RHF
  defaults (`currency`, `inStock`) are applied.
- **Mutation-state UI**: shows the `role="alert"` error when `mutation.isError`; disables the Create
  button when `mutation.isPending`.

## Framework / mocking approach
- **Runner/renderer**: Vitest + React Testing Library + `@testing-library/user-event` (jsdom),
  exactly the stack already in `package.json`. Queries are by role/label/text (user-facing), not by
  test ids or class names.
- **Mocked dependencies** (the real shared pieces named in `MODULE_REGISTRY.md`, not invented stand-ins):
  - `@/components/shared/form` — lightweight `InputField`/`SelectField` wired to RHF via
    `useFormContext`, rendering associated `<label>`/`<input>` and the field error. They register
    number inputs with `valueAsNumber` so the price reaches the schema as a number, mirroring the real
    fields. (The real field source files are not present in this repo snapshot — only the barrel
    `index.ts` re-exports them — so mocking is required for the form to render at all.)
  - `@/hooks/use-auth` — drives the admin/non-admin gate.
  - `../hooks/use-products` — the feature mutation hook is replaced with a `mutate` spy plus
    controllable `isError`/`isPending`, so the submitted body and the error/pending UI are asserted
    without a live network or a `QueryClientProvider`.
- **Real vs mocked**: the form component, React Hook Form, `zodResolver`, and the real
  `createProductSchema` all run for real — so validation, defaults, and the submit body are exercised
  authentically. Only the collaborators above are mocked. No `QueryClientProvider` is needed because
  the mutation hook itself is mocked.

## How to run
From `frontend/`:

```
npm install   # restore node_modules first (not present in this snapshot)
npm test      # vitest run  (or: npm run test:watch)
```

Note: per task constraints, install/tests were NOT run here, and no source files or
`MODULE_REGISTRY.md` were modified. The tests are written to pass against the current source.
