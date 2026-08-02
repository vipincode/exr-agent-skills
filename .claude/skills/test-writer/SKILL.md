---
name: test-writer
description: Write tests on demand for whatever the user points at — backend services, controllers, routes, and integration paths, or frontend components, hooks, schemas, and bound screens. Use this ONLY when the user explicitly asks for tests — "write tests for auth.service.ts", "test the product module", "add component tests for product-card.tsx", "cover the create-product form", "test the useProductsQuery hook", "test this binding", "write tests for the slice I just built". It is a standalone utility run manually — never auto-chained from module-planner or module-builder, though module-builder will suggest it once a slice lands. It infers the domain from the target's path, reads ARCHITECTURE.md for conventions (the real response envelope, error model, data-fetching approach) and MODULE_REGISTRY.md for which collaborators are real shared pieces worth mocking faithfully, detects the installed test framework and mocking setup from package.json rather than assuming one, and reads the slice's Testing checklist from _docs/features/<module>/NN-*.md when one exists — that checklist is the behavior spec the code was built to satisfy. It never modifies source files and never touches the registry.
---

# test-writer

Write tests for a target the user points at — a file, a module, a feature, a slice, or just a name. A pure, on-demand utility: the user calls it explicitly and it does one thing.

**It is never invoked by the other skills, never modifies source, and never edits `MODULE_REGISTRY.md`.** `module-builder` suggests running it after a slice lands, but suggesting is where that ends — the user decides.

The domain is a detail, not a fork in the workflow: the shape of the work is identical either way (read the real code → detect the setup → write matching tests). Infer backend vs frontend from the target's path and the project it sits in, and pick up the matching patterns reference. A slice that spans both gets both.

## Step 1 — Read context (do not assume)

Resolve the project dir for the target's domain via `../LAYOUT.md` (`.claude/workspace.json`; legacy fallback is a root `ARCHITECTURE.md`). The contract files, `package.json`, and the target files are all relative to it.

1. **The target file(s)** — read the real implementation, not an assumption of it. If the user named a module, feature, or slice, read its actual pieces: service/controller/routes on the backend, template/components/hooks/api/schema on the frontend. **You test what the code does, not what it was supposed to do** — a test written from the plan alone will pass against code that doesn't exist.
2. **`ARCHITECTURE.md`** — the conventions that shape assertions. Backend: the response envelope (so you assert the real success shape), the error model (so you assert the right error class and status), the validation flow. Frontend: the envelope again (so a mocked response matches reality), how the client reaches the backend, that server state goes through the query library, that forms use the shared field components, where types come from.
3. **`MODULE_REGISTRY.md`** — which collaborators are real shared pieces. Mock the *real* dependency (the model, another module's service, the HTTP instance, the auth hook, a shared component) rather than inventing a fake that drifts from how it actually behaves. A test passing against a fake that doesn't match production is worse than no test.
4. **The slice's Testing checklist, if there is one.** Look for `_docs/features/<module>/NN-<slice>.md` covering this target and read its **Testing checklist** — that's the behavior list the code was built to satisfy, written when the contract was fresh, and it makes an excellent spec. Honor it: cover everything it lists. You may add cases beyond it.

## Step 2 — Detect, don't ask (where possible)

- **Framework** — read `package.json`. Use whatever is installed (Vitest, Jest); only ask if neither is present, and then suggest Vitest as the default for a modern TS project. On the frontend, also confirm the renderer (React Testing Library + `user-event`, and `jsdom`/`happy-dom`).
- **Mocking approach** — if a network-mocking library (e.g. MSW) is already installed, prefer it for hook and integration tests: intercepting at the network boundary keeps tests honest about the envelope. Otherwise mock the HTTP instance directly. Don't introduce a new mocking library when one is already in use.
- **File convention** — detect existing tests: colocated `*.test.ts` / `*.test.tsx` next to source, a `__tests__/` directory, or a top-level `test/`. Match it. If none exists, default to colocated.
- **Import convention** — match the project's (e.g. explicit extensions under NodeNext) so the test file compiles under the same tsconfig.
- **Setup file** — check for a test setup (custom matchers, cleanup, the jsdom environment). If it's missing and the tests need it, say so rather than silently assuming it's there.

## Step 3 — Ask only what's genuinely open (≤2 questions)

Only if not inferable from the request or a checklist:

- **Scope** — unit only, or also integration? (Backend integration means the real app via supertest, with an in-memory database if the path hits one. Frontend integration means the screen rendered with real providers and a mocked network.)
- **Coverage intent** — happy path only, or also the edge cases: failure branches, auth-guard rejections, validation failures, loading/empty/error states, envelope drift?

If the request already implies these ("quick unit tests for the service", "just a render test for the card"), or a slice checklist is present, skip the questions.

## Step 4 — Write the tests

Follow `references/backend-patterns.md` or `references/frontend-patterns.md` for the layer being tested.

**Backend:**
- **Service** → unit test with the model and collaborators mocked; assert the returned data and that the right error is thrown on each failure path.
- **Controller** → mock the service; assert the response envelope shape and status via a mocked response object.
- **Routes / integration** → supertest against the built app; assert real status codes and the real envelope; use an in-memory database if the path touches one.

**Frontend:**
- **Presentational component** → render it, assert it shows the props it's given and the right state ("Sold out" when `inStock` is false); drive interactions with `user-event`.
- **Query hook** → render inside the real provider (retries off), mock the network, assert it returns the unwrapped and validated data, and that the error state surfaces on a failing or invalid response.
- **Bound screen (integration)** → render the template with providers and a mocked network; assert loading → data, the empty state on `[]`, and the error state on failure. Assert **envelope drift is caught** — a malformed payload must error, never render silently.
- **Form** → fill via `user-event`; assert validation messages on bad input, that the mutation is called with the validated body on submit, and that role-gated controls respect the auth hook.
- **Schema** → valid input parses; invalid or drifted input throws.

Match the project's assertion style and the real envelope shape. Mock the real shared pieces named in the registry, not stand-ins.

## Step 5 — Report

State what was tested, the framework / renderer / mocking approach used, what was mocked versus real, and how to run it (`<pm> run test`). Note any missing test infrastructure you assumed or that needs installing (a mocking library, a setup file).

If you ran the tests, report what actually happened. **If you couldn't run them, say so** rather than implying they pass — an untested test file is a plausible-looking liability.

## Guardrails

- **Standalone only.** Never triggered automatically by plan or build flows; never triggers them.
- **Read-only on source.** Never edit the implementation to make it testable. If it's hard to test, say why and suggest a refactor — but leave the source alone.
- **Never touch `MODULE_REGISTRY.md`.**
- **Test behavior, not implementation details.** Query by role and text the way a user would; don't assert on internal class names or component internals. Avoid brittle snapshot-only tests.
- **Mock the real shared pieces** named in the registry, not stand-ins that drift from actual behavior.
- **Honor the slice checklist** when one exists — it's the spec the code was built against, and skipping items silently leaves exactly the gaps the plan was trying to close.
