# frontend-test-writer

Writes tests for frontend code **on demand** — components, hooks (including TanStack Query hooks), Zod schemas, and API-binding behavior. Vitest + React Testing Library.

## What it does

- Reads `ARCHITECTURE.md` (conventions), `MODULE_REGISTRY.md` (what to mock vs use for real), the target file(s), and the FEATURE_PLAN's testing checklist if one exists.
- Detects the test framework and RTL setup from `package.json` — asks at most 2 questions.
- Writes test files matching your project's existing test style.

## Example prompts

- "Write tests for the products grid"
- "Test the useProductsQuery hook"
- "Add component tests for product-card.tsx"
- "Cover the create-product form"

## Important

- **Only runs when you explicitly ask for tests** — never auto-chained after planning or building.
- Never modifies source files and never touches the registry — test files only.
- Frontend only; Express/Mongoose tests are `backend-test-writer`.
