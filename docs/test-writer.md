# test-writer

Writes tests for whatever you point at — backend or frontend. On demand, always.

## What it does

- Infers the domain from the target's path; you don't have to say which.
- Reads the **real implementation**, not the plan — tests are written against what the code actually does.
- Reads `ARCHITECTURE.md` (so assertions match your real envelope and error model) and `MODULE_REGISTRY.md` (so it mocks the *real* shared dependency rather than a fake that drifts from it).
- **Reads the slice's testing checklist** from `_docs/features/<module>/NN-*.md` when one exists — that's the behavior list the code was built to satisfy, and it makes an excellent spec.
- Detects your installed framework, renderer, and mocking setup from `package.json` instead of assuming one.

## What it covers

**Backend** — services (collaborators mocked, error paths asserted), controllers (envelope shape and status), routes/integration (supertest, in-memory DB where the path needs one).

**Frontend** — presentational components, query hooks (real provider, mocked network, unwrapped and validated data), bound screens (loading → data, empty, error, and envelope drift caught), forms (validation messages, the mutation called with the validated body, role-gated controls), and schemas.

## Example prompts

- "Write tests for auth.service.ts"
- "Test the product module"
- "Add component tests for product-card.tsx"
- "Cover the create-product form"
- "Test the useProductsQuery hook"
- "Write tests for the slice I just built"

## Important

- **Never runs automatically.** `module-builder` suggests it when a slice lands; running it is your call.
- **Read-only on your source.** If something is hard to test, it says why and suggests a refactor — it won't edit the implementation to make its own tests pass.
- **Never touches `MODULE_REGISTRY.md`.**
- Tests behavior, not internals — queries by role and text the way a user would, avoids brittle snapshot-only tests.
- If it couldn't run the tests, it says so rather than implying they pass.
