---
name: code-review
description: Review code against THIS project's own conventions — backend (Express, Node, TypeScript, Mongoose APIs) or frontend (Next.js App Router, React, TypeScript, Tailwind, and the project's data-fetching/forms stack) — for correctness, security, duplication, contract conformance, accessibility, and performance. Use whenever the user asks to review, audit, critique, or sanity-check code: "review this service", "code review the auth module", "review this component", "review my changes / this PR / the diff", "is this production-ready", "check this for issues", "review the slice I just built". It infers the domain from what it's pointed at and applies the matching checklist; a fullstack slice gets both. It reads ARCHITECTURE.md + MODULE_REGISTRY.md so it reviews against the project's real envelope, error model, layout, and conventions instead of imposing a personal style, and flags code duplicating existing registry entries. Standalone and read-only — run anytime, never auto-chained, and it does not modify source unless explicitly asked to apply fixes. This is STATIC review only — it does not run the app or confirm behavior at runtime, so "verify it works", "does it run", "check my change actually works" are run/verify intent, not review.
---

# code-review

Review code against the project's own conventions and solid practice, and report findings the user can act on.

What makes this more useful than a generic review: it reads the contract, so it reviews against *this* project — its envelope, error model, validation flow, layout, paradigm, import convention, component-placement rule — instead of imposing a personal style. And it checks new code against `MODULE_REGISTRY.md` to catch reinvented utilities and components.

Standalone, read-only utility. Run on demand against a file, a module, a feature, a slice, a set of changed files, or a diff. **Never auto-invoked by other skills** (`module-builder` suggests it after a slice lands, and that's where the suggestion ends), **and it does not edit source unless the user explicitly asks for fixes.**

Domain is inferred, not asked: judge it from what you're pointed at and which project dir it sits in, then use the matching checklist — `references/backend-checklist.md` or `references/frontend-checklist.md`. A slice that spans both gets both, reported as one review.

## Step 1 — Establish scope and context

Resolve the project dir for the target's domain via `../LAYOUT.md` (`.claude/workspace.json`; legacy fallback is a root `ARCHITECTURE.md`). In a monorepo this also keeps the review scoped to the right folder rather than a sibling project.

1. **Scope** — detect it from the request: a named file/module/feature, the working changes (`git diff`, staged, or a branch/PR), or "the project". If the repo is git-managed and the user says "my changes" or "this PR", review the **diff**, not the whole tree. Ask only if scope is genuinely unclear.
2. **Contract** — read `ARCHITECTURE.md` and `MODULE_REGISTRY.md` if present, and review against what they say. If absent, review against general best practice and note **once** that running `project-onboard` first would let the review enforce project conventions — don't repeat that caveat per finding.
3. **The slice, if there is one** — if the code came from a slice in `_docs/features/<module>/`, read it. Its API contract section and testing checklist tell you what the code was *supposed* to do, which turns vague findings into specific ones ("returns `{ items }` but the contract says `{ data: { items, total } }`").
4. **Read the actual code**, plus enough surrounding context to judge reuse and integration — the module's siblings, the shared lib/middleware/components it touches, the registry entry it should have used. Don't review a file in isolation: duplication and placement errors are only visible in context.

## Step 2 — Review across the dimensions

Work through the matching checklist. In priority order:

**Backend**
- **Correctness & async** — await bugs, unhandled rejections, race conditions, wrong control flow, off-by-one, type holes (`any`, unsafe casts).
- **Security** — injection (NoSQL operators, unsanitized query objects), mass assignment, missing or incorrect auth/role checks, secret leakage, missing rate limiting on sensitive routes, sensitive data in responses or logs.
- **Error handling** — conformance to the project's error model; swallowed errors; leaked internals; correct status/code mapping.
- **Data layer** — missing indexes on queried/unique fields, N+1 queries, missing `.lean()` on reads, unbounded queries, transaction safety on multi-document writes, schema validation gaps.
- **API & contract conformance** — the response envelope matches the project's (and the slice's, if one exists); input validated through the project's flow; auth guards present where the pattern expects them.
- **DRY & convention** — code duplicating a registry entry or existing util/middleware; layout, paradigm, or import-convention deviations.
- **Performance** — needless work in hot paths, missing pagination, leaks, blocking calls.
- **Readability** — naming, dead code, oversized functions. Lowest priority, kept brief.

**Frontend**
- **Correctness & React** — broken or missing hook deps causing stale closures and refetch loops, conditionally-called hooks, missing list keys (or index-as-key on reorderable lists), state derived in an effect that should be computed in render, unstable inline objects passed as query keys or deps, promise mishandling, type holes (`any`, unsafe `as`, non-null `!`).
- **Component duplication & placement (a headline concern)** — a component/hook/util duplicating a registry entry or an existing shared piece; a re-implemented UI primitive instead of a composed one; something in the wrong home per the placement rule (domain-specific in shared, or generic copy-pasted inside a feature); **cross-feature imports** instead of promoting the shared piece.
- **API-binding conformance** — requests go through the shared HTTP instance and, where the project has one, the same-origin BFF (never the backend's absolute URL or a backend secret in client code); the **envelope is unwrapped and schema-validated** rather than trusted as raw `any`; server state lives in the query library, not `useEffect` + `useState` + fetch; query keys are namespaced arrays; mutations invalidate the right keys or do optimistic updates with rollback; loading/empty/error states are actually handled.
- **Forms & validation** — fields use the shared field components (no raw inputs wired by hand, no hand-rolled error text); the schema resolver is wired; types are inferred, not parallel interfaces.
- **App Router boundaries** — client directives only where interactivity needs them, not on whole trees; no server-only secrets reaching client components; pages stay thin; data fetching placed correctly.
- **Accessibility** — real `button`/`a` rather than click-handler `div`s, inputs with associated labels, images with `alt`, working focus and keyboard interaction, color not the only signal. Practical, not a full WCAG audit.
- **Performance** — needless client components, unmemoized expensive renders, request waterfalls, heavy libraries pulled into client bundles, list flicker on paging where it actually matters, uncleared timers and subscriptions.
- **Readability** — naming, dead code, oversized components. Lowest priority.

**Only flag convention items that conflict with what the contract actually says.** Don't invent rules or impose preferences the project doesn't hold — no dinging Joi for not being Zod, or axios for not being `fetch`, when the contract mandates them. A review that fights the project's own decisions gets ignored, and rightly.

## Step 3 — Report

Lead with a one-line **verdict** ("Solid overall; two High issues to fix before merge", "Not production-ready — a Critical auth gap"). Then findings grouped by severity, highest first. Each one tight:

- **`severity` — `file:line` — short title**
  One or two sentences: what's wrong and why it matters, then the concrete fix. Include a corrected snippet only when it clarifies. No padding.

Severity rubric:

- **Critical** — a security hole, data loss or corruption, exposure of secrets to the client, an auth check that exists only in the UI with no real gate behind it, or a bug that breaks production.
- **High** — a real bug (stale-closure data, refetch loop, unhandled error that crashes), or a violation of the project's response/error/binding contract that makes data wrong or inconsistent.
- **Medium** — duplication of existing code, wrong placement, cross-feature import, missing validation or auth-gating where the pattern expects it, a meaningful performance, index, or accessibility issue.
- **Low** — style, naming, minor maintainability.

End with a brief **What's good** note when warranted — accurate, not flattery — so the author knows what to keep. If nothing is wrong, say so plainly. **Do not manufacture findings to look thorough**: over-flagging trains people to ignore reviews, which costs more than the missed nitpick was worth.

## Step 4 — Fixes only if asked

Reviewing is the default and it ends at the report. If the user then asks you to apply fixes, make the smallest correct diff that respects the contract. For anything that reintroduces shared code, follow the dedup rule — reuse the registry entry, or promote the duplicate to the shared location, rather than patching the copy. Otherwise leave the source untouched.

## Guardrails

- **Read-only by default.** Report, don't rewrite, unless explicitly asked.
- **Review against the contract, not taste.** Project conventions win; flag deviations from them, not from your preferences.
- **Be specific.** Every finding needs a location and a concrete fix — never "improve error handling" with no anchor.
- **Honest calibration.** Don't rubber-stamp, don't inflate. Severity has to mean something.
- **Right checklist for the code.** Backend checks on server code, frontend checks on client code; a fullstack slice gets both. Misapplying one to the other produces confident nonsense.
- **Static only.** This doesn't run anything. If the user wants to know whether it *works*, that's verification, not review — say so.
