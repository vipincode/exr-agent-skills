# Test Summary — products Zod schema

## Target
`frontend/src/features/products/schema/products.schema.ts`

Exports five Zod schemas:
- `productSchema` — a single product (id, name, slug, integer-cents price, currency, category, inStock, optional imageUrl).
- `productListDataSchema` — paginated list payload (`items`, `total`, `page`, `limit`).
- `productsEnvelopeSchema` — API envelope (`success: literal(true)`, `data`, optional `message`).
- `productFiltersSchema` — all-optional query filters (`page`, `limit`, `search`, `category`).
- `createProductSchema` — create-form input with constraints (`name`/`category` min 1, `price` positive int, `currency` length 3 default "USD", `inStock` default true, optional `imageUrl`).

## Framework
**Vitest** — already a devDependency in `frontend/package.json` with scripts `test` (`vitest run`) and `test:watch` (`vitest`). Zod 4 is a dependency.

No Vitest config, tsconfig path aliases, or pre-existing tests were present, so the test imports the schema with a **relative path** (`./products.schema`) — no `@/` alias or config file is required for Vitest to discover and run it (default include glob `**/*.{test,spec}.*`). No new dependencies or config files were added; no source files were modified.

## Test file
`frontend/src/features/products/schema/products.schema.test.ts`

## What is tested
For each schema, both the happy path and the meaningful failure/edge cases are covered using `safeParse`:

- **productSchema**: valid product; omitted optional `imageUrl`; rejects non-integer `price`; allows zero/negative integer price (no positivity constraint at this layer); rejects invalid `imageUrl`; rejects each missing required field; rejects wrong types per field.
- **productListDataSchema**: valid payload; empty `items` array; rejects an invalid nested item; rejects non-array `items`; rejects non-number `total`/`page`/`limit`; rejects missing fields.
- **productsEnvelopeSchema**: valid envelope; optional `message` omitted; rejects `success: false` (literal-true enforcement); rejects missing `success`; rejects invalid nested `data`; rejects non-string `message`.
- **productFiltersSchema**: empty object accepted (all optional); fully-populated object; rejects wrong types per field.
- **createProductSchema**: valid input; defaults applied for `currency` ("USD") and `inStock` (true) when omitted; empty `name`/`category` rejected with their configured messages; non-positive `price` (0, negative) rejected with "Price must be greater than 0"; non-integer `price` rejected; `currency` not exactly 3 chars rejected; invalid `imageUrl` rejected; optional `imageUrl` omitted accepted; missing required fields rejected.

## How to run
From the `frontend/` directory:

```bash
npm install        # if node_modules is not present
npm test           # runs: vitest run
# or watch mode:
npm run test:watch
```

To run only this file:

```bash
npx vitest run src/features/products/schema/products.schema.test.ts
```
