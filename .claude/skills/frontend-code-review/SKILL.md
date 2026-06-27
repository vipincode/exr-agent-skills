---
name: frontend-code-review
description: Review frontend / client-side code (Next.js App Router, React, TypeScript, Tailwind + shadcn/ui, axios + Zod + TanStack Query + RHF) for correctness, component duplication, API-binding conformance, convention adherence, accessibility, and performance. Use whenever the user asks to review, audit, critique, or sanity-check frontend code — "review this component", "code review the products binding", "review my changes / this PR / the diff", "is this screen production-ready", "check this React code for issues". It reads the frontend ARCHITECTURE.md + MODULE_REGISTRY.md so it reviews against THIS project's conventions and flags components/hooks/utils that duplicate existing shared pieces or registry entries (DRY), plus bindings that bypass the BFF/axios/Zod/Query standard. Standalone and read-only — run anytime, never auto-chained, and it does not modify source unless explicitly asked to apply fixes. Tuned for frontend; NOT for backend/Express/Mongoose review (that is backend-code-review). This is static code review only — it does NOT run the app or confirm behavior at runtime; requests like "verify it works", "does it render", or "check my change actually works" are run/verify intent (/verify or /run), not review. Frontend / Next.js / React / component / API-binding scope only.
---

# frontend-code-review

Review frontend code against the project's own conventions and solid React/Next.js practice, and report findings the user can act on. What makes this more useful than a generic review: it reads the contract, so it reviews against *this* project (its BFF/axios path, envelope, Zod validation flow, TanStack Query usage, shared-component rule, feature-module layout) instead of imposing a personal style — and it checks new code against `MODULE_REGISTRY.md` to catch reinvented components, hooks, and utils.

Standalone, read-only utility. Run on demand against a file, a feature module, a set of changed files, or a diff. **Never auto-invoked by other skills, and it does not edit source unless the user explicitly asks for fixes.**

## Step 1 — Establish scope and context

**First resolve the project dir** for this (`frontend`) domain via `../LAYOUT.md` (read `.claude/workspace.json`; fall back to the repo root if a root `ARCHITECTURE.md` for a Next.js/React app exists with no manifest). The contract files and the code under review are **relative to that project dir** — in a monorepo this keeps the review scoped to the frontend folder, not a sibling `backend/`.

1. **Scope** — what to review. Detect from the request: a named file/module, the working changes (`git diff`, staged, or a branch/PR), or "the project". If a repo is git-managed and the user says "my changes"/"this PR", review the diff, not the whole tree. Ask only if scope is genuinely unclear.
2. **Contract** — read `ARCHITECTURE.md` and `MODULE_REGISTRY.md` if present. Review against what they say. If absent, review against general frontend best practice and note once that running the frontend bootstrap/onboard first would let the review enforce project conventions (don't repeat this caveat per finding).
3. **Read the actual code** under review, plus enough surrounding context to judge reuse and integration — the feature's siblings, the shared components/hooks/lib it touches, the registry entry it should have used. Don't review a file in isolation; duplication and placement errors are only visible in context.

## Step 2 — Review across the dimensions

Work through `references/review-checklist.md`. The dimensions, in priority order:

- **Correctness & React** — broken/missing hook deps causing stale closures or refetch loops, conditionally-called hooks, missing list `key`s (or index-as-key on reorderable lists), state derived in `useEffect` that should be computed in render, unstable inline objects/functions passed as query keys or deps, `await`/promise mishandling, type holes (`any`, unsafe `as`, non-null `!`).
- **Component duplication & placement (DRY)** — this is a headline concern: a component/hook/util that duplicates a `MODULE_REGISTRY.md` entry or an existing `components/shared` / `lib` / `hooks` piece; a re-implemented shadcn `ui/` primitive instead of composing it; a component in the wrong home per the placement rule (domain-specific thing in `components/shared`, or a generic thing copy-pasted inside a feature); **cross-feature imports** (`features/a` importing from `features/b`) instead of promoting the shared piece.
- **API-binding conformance** — the standard this toolkit enforces: requests go through the shared `api` axios instance + same-origin `/api` BFF (never `fetch` to the backend's absolute URL from the browser; never `BACKEND_URL`/secrets in client code); the response **envelope is unwrapped and Zod-parsed** (no trusting raw `any` from a response); server state lives in **TanStack Query** (not `useEffect` + `useState` + fetch); query keys are arrays namespaced by feature; mutations invalidate the right keys (or do optimistic updates with rollback); loading / empty / error states are actually handled.
- **Forms & validation** — every field is a shared `*Field` (no raw `useController`/`<input>` wiring, no hand-rolled error text); `zodResolver` with the module's schema; types via `z.infer`, not parallel interfaces.
- **Next.js App Router** — `"use client"` only where interactivity needs it (not slapped on whole pages/trees); server/client boundary respected (no server-only secrets or `process.env` server vars reaching client components); `page.tsx` stays thin and renders a `template/`; data-fetching placed correctly (Server Component fetch vs client Query).
- **Accessibility** — interactive elements are real `button`/`a` (not click-handler `div`s), inputs have associated labels, images have `alt`, focus/keyboard works for custom interactive UI, color isn't the only signal. Keep it practical, not a full WCAG audit.
- **Performance & resource use** — needless client components, unmemoized expensive renders, request waterfalls (sequential awaits that could be parallel/prefetched), large client bundles from importing heavy libs into client code, missing `keepPreviousData` causing visible list flicker on paging (only flag if it actually matters), uncleared timers/listeners/subscriptions.
- **Readability/maintainability** — naming, dead code, oversized components doing too much — lowest priority, kept brief.

Only flag DRY/convention items that conflict with what the contract actually says — do not invent rules or impose preferences the project doesn't hold (e.g. don't ding axios for not being `fetch` if the contract mandates axios).

## Step 3 — Report

Lead with a one-line **verdict** (e.g. "Solid binding; two High issues to fix before merge" or "Not production-ready — a duplicated card and a binding that bypasses the BFF"). Then findings grouped by severity, highest first. Each finding is tight:

- **`severity` — `file:line` — short title**
  One or two sentences: what's wrong and why it matters, then the concrete fix (a corrected snippet only when it clarifies). No padding.

Severity rubric:
- **Critical** — security/data exposure (secret or backend URL shipped to the client, auth check only in the UI with no real gate behind it), or a bug that breaks the feature in production.
- **High** — a real bug (stale-closure data, refetch loop, unhandled error state that crashes), or a binding that violates the BFF/envelope/Query standard so data is wrong or unsafe.
- **Medium** — DRY violation (duplicates a registry/shared entry), wrong component placement, cross-feature import, missing validation/auth-gating where the pattern expects it, raw-field-instead-of-`*Field`, a meaningful a11y or perf issue.
- **Low** — style, naming, minor maintainability.

End with a brief **What's good** note when warranted — accurate, not flattery — so the review is balanced and the author knows what to keep. If nothing is wrong, say so plainly; do not manufacture findings to look thorough. Calibrate honestly: over-flagging trains people to ignore reviews.

## Step 4 — Fixes only if asked

Reviewing is the default and it ends at the report. If the user then asks to apply fixes, make the changes (smallest correct diff, respecting the contract), and for anything that reintroduces shared code, follow the dedup rule — reuse the registry entry / promote the duplicate to `components/shared` rather than patching the copy. Otherwise leave the source untouched.

## Guardrails

- **Read-only by default.** Report, don't rewrite, unless explicitly asked.
- **Review against the contract, not taste.** Project conventions win; flag deviations from them, not from your preferences.
- **Be specific.** Every finding needs a location and a concrete fix — never "improve error handling" with no anchor.
- **Honest calibration.** Don't rubber-stamp; don't inflate. Severity must mean something.
- **Frontend scope.** This checklist is for client-side React/Next.js code; say so if pointed at backend rather than misapplying it.
