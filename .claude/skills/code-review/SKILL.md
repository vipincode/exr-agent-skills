---
name: code-review
description: Review backend / server-side code (Express, Node, TypeScript, Mongoose APIs) for correctness, security, convention adherence, and duplication. Use whenever the user asks to review, audit, critique, or sanity-check backend code — "review this service", "code review the auth module", "review my changes / this PR / the diff", "is this production-ready", "check this for issues". It reads ARCHITECTURE.md + MODULE_REGISTRY.md so it reviews against THIS project's conventions and flags code that duplicates existing registry entries (DRY). Standalone and read-only — run anytime, never auto-chained, and it does not modify source unless explicitly asked to apply fixes. Tuned for backend; not for frontend/React review. This is static code review only — it does NOT run the app or confirm a change behaves correctly at runtime; requests like "verify it works", "does it run", or "check that my change actually works" are run/verify intent (/verify or /run), not review.
---

# code-review

Review backend code against the project's own conventions and solid server-side practice, and report findings the user can act on. The thing that makes this more useful than a generic review: it reads the contract, so it reviews against *this* project (its envelope, error model, validation flow, layout, paradigm, import convention) instead of imposing a personal style — and it checks new code against `MODULE_REGISTRY.md` to catch reinvented utilities.

Standalone, read-only utility. Run on demand against a file, a module, a set of changed files, or a diff. **Never auto-invoked by other skills, and it does not edit source unless the user explicitly asks for fixes.**

## Step 1 — Establish scope and context

1. **Scope** — what to review. Detect from the request: a named file/module, the working changes (`git diff`, staged, or a branch/PR), or "the project". If a repo is git-managed and the user says "my changes"/"this PR", review the diff, not the whole tree. Ask only if scope is genuinely unclear.
2. **Contract** — read `ARCHITECTURE.md` and `MODULE_REGISTRY.md` if present. Review against what they say. If absent, review against general backend best practice and note once that running `project-onboard` first would let the review enforce project conventions (don't repeat this caveat per finding).
3. **Read the actual code** under review, plus enough surrounding context (the module's siblings, the shared lib/middleware it touches) to judge reuse and integration — not the file in isolation.

## Step 2 — Review across the dimensions

Work through `references/review-checklist.md`. The dimensions, in priority order:
- **Correctness & async** — await bugs, unhandled rejections, race conditions, wrong control flow, off-by-one, type holes (`any`, unsafe casts).
- **Security** — injection (NoSQL/`$where`/unsanitized query objects), mass assignment, missing/incorrect auth or role checks, secret leakage, missing rate limiting on sensitive routes, sensitive data in responses/logs.
- **Error handling** — conformance to the project's error model; swallowed errors; leaking internals; correct status/code mapping.
- **Data layer (Mongoose)** — missing indexes on queried/unique fields, N+1 queries, missing `.lean()` on reads, unbounded queries, transaction safety on multi-doc writes, schema validation gaps.
- **API & contract conformance** — response envelope matches the project's; input validated via the project's flow; auth guards present where the pattern expects them.
- **DRY / convention** — code that duplicates a registry entry or an existing util/middleware; layout/paradigm/import-convention deviations from ARCHITECTURE.md.
- **Performance & resource use** — needless work in hot paths, missing pagination, leaks (uncleared timers/listeners), blocking calls.
- **Readability/maintainability** — naming, dead code, oversized functions — lowest priority, kept brief.

Only flag DRY/convention items that conflict with what the contract actually says — do not invent rules or impose preferences the project doesn't hold (e.g. don't ding Joi for not being Zod if the contract says Joi).

## Step 3 — Report

Lead with a one-line **verdict** (e.g. "Solid overall; two High issues to fix before merge" or "Not production-ready — a Critical auth gap"). Then findings grouped by severity, highest first. Each finding is tight:

- **`severity` — `file:line` — short title**
  One or two sentences: what's wrong and why it matters, then the concrete fix (a corrected snippet only when it clarifies). No padding.

Severity rubric:
- **Critical** — security hole, data loss/corruption, or a bug that breaks production.
- **High** — a real bug, or a violation of the project's error/response contract that breaks API consistency.
- **Medium** — DRY violation (duplicates existing code), missing validation/auth where the pattern expects it, meaningful perf issue, missing index.
- **Low** — style, naming, minor maintainability.

End with a brief **What's good** note when warranted — accurate, not flattery — so the review is balanced and the author knows what to keep. If nothing is wrong, say so plainly; do not manufacture findings to look thorough. Calibrate honestly: over-flagging trains people to ignore reviews.

## Step 4 — Fixes only if asked

Reviewing is the default and it ends at the report. If the user then asks to apply fixes, make the changes (smallest correct diff, respecting the contract), and for anything that reintroduces shared code, follow the dedup rule — reuse the registry entry rather than patching a duplicate. Otherwise leave the source untouched.

## Guardrails

- **Read-only by default.** Report, don't rewrite, unless explicitly asked.
- **Review against the contract, not taste.** Project conventions win; flag deviations from them, not from your preferences.
- **Be specific.** Every finding needs a location and a concrete fix — never "improve error handling" with no anchor.
- **Honest calibration.** Don't rubber-stamp; don't inflate. Severity must mean something.
- **Backend scope.** This checklist is for server-side code; say so if pointed at frontend rather than misapplying it.
