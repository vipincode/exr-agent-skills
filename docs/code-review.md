# code-review

Static review of backend or frontend code against **your project's own conventions**.

## What it does

- Infers the domain from what you point it at and applies the matching checklist. A fullstack slice gets both, reported as one review.
- Reads `ARCHITECTURE.md` + `MODULE_REGISTRY.md`, so it reviews against your envelope, error model, layout, and placement rules — not a generic style guide.
- Reads the slice file when the code came from one, so findings can be specific: "returns `{ items }` but the contract says `{ data: { items, total } }`".
- Flags code that duplicates something already in the registry.

## What it looks for

**Backend** — correctness and async bugs, security (injection, mass assignment, missing auth/role checks, secret leakage), error-model conformance, data-layer issues (missing indexes, N+1, unbounded queries, transaction safety), response-envelope conformance, duplication, performance.

**Frontend** — React correctness (stale closures, refetch loops, hook rules, keys), **component duplication and placement** (including cross-feature imports and re-implemented primitives), API-binding conformance (client talks only to the app's own origin, envelope unwrapped and validated, server state in the query library, correct invalidation, real loading/empty/error states), forms via the shared field layer, App Router client/server boundaries, accessibility, performance.

## Example prompts

- "Review this service"
- "Code review the auth module"
- "Review this component"
- "Review my changes" / "review this PR"
- "Is this production-ready?"
- "Review the slice I just built"

## Important

- **Read-only by default.** It reports; it only edits if you then ask it to apply fixes.
- **Reviews against your contract, not its taste.** It won't ding Joi for not being Zod if your contract says Joi.
- **Honestly calibrated.** Severity means something, and it won't manufacture findings to look thorough. If nothing's wrong it says so.
- **Static only.** It reads code; it does not run your app. "Does it work?" is verification, not review.
- Say "review my changes" in a git repo and it reviews the diff, not the whole tree.
