---
name: frontend-test-writer
description: Write tests for frontend Next.js/React code on demand — components, hooks (incl. TanStack Query hooks), Zod schemas, and API-binding behavior. Use this ONLY when the user explicitly asks to test frontend code — "write tests for the products grid", "test the useProductsQuery hook", "add component tests for product-card.tsx", "cover the create-product form", "test this binding". It is a standalone utility, run manually whenever the user wants — never auto-chained from frontend-feature-planner or frontend-module-builder. It reads ARCHITECTURE.md (conventions), MODULE_REGISTRY.md (what to mock vs use), the target file(s), and the FEATURE_PLAN's testing checklist if present, detects the test framework + RTL setup from package.json, and writes matching test files. It never modifies source files and never touches the registry. It is NOT for backend tests (that is backend-test-writer). Frontend / Next.js / React / Vitest+RTL scope only.
---

# frontend-test-writer

Write tests for a frontend target the user points at — a component, a hook, a schema, a feature module, or a feature name. A pure, on-demand utility: the user calls it explicitly and it does one thing. **It is never invoked by the other skills, never modifies source, and never edits MODULE_REGISTRY.md.**

## Step 1 — Read context (do not assume)

**First resolve the project dir** for this (`frontend`) domain via `../LAYOUT.md` (read `.claude/workspace.json`; fall back to the repo root if a root `ARCHITECTURE.md` for a Next.js/React app exists with no manifest). The contract files, `package.json` (framework detection), and the target files are all **relative to that project dir**.

1. The **target file(s)** the user named — read the real implementation, not an assumption of it. If they named a module or feature, read its template/components/hooks/api/schema. You test what the code actually does.
2. `ARCHITECTURE.md` — the conventions that shape assertions: the response envelope (so a mocked API response matches reality), the BFF/axios path, that server state goes through TanStack Query, that forms use the shared `*Field`, that types come from Zod.
3. `MODULE_REGISTRY.md` — to know which collaborators are real shared pieces, so you mock the *real* dependency (the `api` axios instance, a shared component, `useAuth`) rather than inventing a fake that drifts from how it actually behaves.
4. **If a `_docs/FEATURE_PLAN_<name>.md` exists** for the target, read its **Testing checklist** — that is the behavior list the binding was built to satisfy and makes an excellent test spec. Honor it; you may add cases, but cover what it lists.

## Step 2 — Detect, don't ask (where possible)

- **Framework + renderer**: read `package.json`. Expect **Vitest + React Testing Library** (`@testing-library/react`, `@testing-library/user-event`, `jsdom`/`happy-dom`) on a Vite/Next TS project; use Jest + RTL if that's what's installed. Match whatever exists.
- **API mocking**: detect MSW (`msw`) if present and prefer it for hook/integration tests (intercept at the network boundary). Otherwise mock the `api` axios instance directly. Don't introduce a new mocking library if one is already in use.
- **File convention**: detect existing tests — colocated `*.test.tsx`/`*.test.ts` next to source, or `__tests__/`. Match it. If none exists, default to colocated `*.test.tsx`.
- **Setup file**: detect `vitest.config`/`setupTests` (e.g. `@testing-library/jest-dom` matchers, `cleanup`). Note if a missing setup needs adding rather than silently assuming it's there.

## Step 3 — Ask only what's genuinely open (≤2 questions)

Only if not inferable:
- **Scope**: unit only (components/hooks/schemas in isolation), or also integration (a screen rendered with a real `QueryClientProvider` and a mocked network)?
- **Coverage intent**: happy path only, or also the edge cases — loading/empty/error states, validation failures, auth-gated UI, envelope/Zod drift?

If the user's request already implies these ("quick render test for the card", or a FEATURE_PLAN checklist is present), skip the questions.

## Step 4 — Write the tests

Follow `references/test-patterns.md` for the layer being tested:
- **Presentational component** → render with RTL, assert it shows the props it's given and the right state (e.g. "Sold out" when `inStock` is false); interactions via `user-event`.
- **TanStack Query hook** → render the hook inside a `QueryClientProvider` wrapper (retries off), mock the network (MSW or the `api` instance), assert it returns the unwrapped/validated data, and that the error state surfaces on a failing/invalid response.
- **Bound screen (integration)** → render the template with provider + mocked network; assert loading → data, the empty state on `[]`, and the error state on failure. Assert envelope drift is caught (a malformed payload throws/errors, never renders silently).
- **Form** → fill via `user-event`, assert Zod validation messages on bad input, assert the mutation is called with the validated body on submit, and that admin-only controls respect `useAuth`.
- **Zod schema** → `parse` valid input passes; invalid/drifted input throws.

Match the project's assertion style and the real envelope shape. Mock the real shared pieces named in the registry, not stand-ins.

## Step 5 — Report

State what was tested, the framework/renderer/mocking approach used, what was mocked vs real, and how to run it (`<pm> run test`). Note any missing test infra you assumed or that needs installing (e.g. `msw`, a setup file). If you couldn't run the tests yourself, say so rather than asserting they pass.

## Guardrails

- **Standalone only.** Never triggered by build/plan flows; never trigger them.
- **Read-only on source.** Never edit the implementation to make it testable — if it's hard to test, note why and suggest a refactor, but leave the source alone.
- **Never touch MODULE_REGISTRY.md.**
- **Test behavior, not implementation details.** Query by role/text like a user; don't assert on internal class names or component internals. Avoid brittle snapshot-only tests.
- **Mock the real shared pieces** named in the registry (the `api` instance, `useAuth`, shared components), not stand-ins that drift from actual behavior.
- **Frontend scope.** Server-side tests are `backend-test-writer`.
