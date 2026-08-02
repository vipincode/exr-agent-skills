# Backend review checklist

Concrete things to look for per dimension. Use the contract to know the project's expected patterns; flag deviations from those, plus the universal issues below. Not every item applies to every file — judge relevance.

## Correctness & async
- `await` missing on a promise (fire-and-forget that should be awaited), or awaiting in a loop where `Promise.all` is correct.
- Unhandled rejections in non-route async code (event handlers, timers, startup).
- On Express 5: handlers needlessly wrapped in `asyncHandler` (contract forbids it); on Express 4: async handlers NOT wrapped and not try/catching → silent unhandled rejection.
- Race conditions: read-modify-write without atomicity; check-then-act on the DB that should be a single atomic update.
- `any`, non-null `!` assertions, or unsafe `as` casts hiding real type gaps.
- Returning before sending a response, or sending twice (`res` called in two branches that can both run).

## Security
- **NoSQL injection**: passing `req.body`/`req.query` straight into a Mongoose query (`Model.find(req.query)`), enabling operator injection (`{ $gt: "" }`, `$where`). Inputs must be validated/whitelisted first.
- **Mass assignment**: spreading `req.body` into `Model.create`/`findByIdAndUpdate` without picking allowed fields → users can set `role`, `isAdmin`, etc.
- **AuthZ gaps**: a mutating or sensitive route missing `protect`/role check; ownership not enforced (user A can act on user B's resource by id).
- **Secrets**: hardcoded keys/tokens; secrets logged; `.env` values echoed in responses or errors.
- **Sensitive data in output**: password hashes, tokens, internal fields returned in API responses (missing field selection / `select: false`).
- **Missing rate limiting / brute-force protection** on auth and other abusable endpoints.
- **Error leakage**: stack traces or raw DB errors returned to clients in production.

## Error handling
- Conforms to the project's error model (throws the contract's error classes; doesn't bare-`throw new Error` where the model expects typed errors).
- Swallowed errors (`catch {}` or catch-and-continue that hides failures).
- Correct status/code mapping (404 for missing, 409 for conflict, 401 vs 403 distinction right).
- try/catch that just re-throws or that defeats Express 5's native forwarding.

## Data layer (Mongoose)
- Missing index on a field used in frequent queries or a uniqueness constraint enforced only in code.
- N+1: querying inside a loop instead of `$in` / `populate` / aggregation.
- Reads that don't need Mongoose documents missing `.lean()` (perf on hot paths).
- Unbounded `find()` with no limit/pagination on a growing collection.
- Multi-document writes that must be atomic but aren't in a transaction/session.
- Schema lacks validation that the API relies on; or duplicate validation drifting from the Zod/Joi schema.

## API & contract conformance
- Response shape matches the project's envelope exactly (no ad-hoc `res.json({...})` that diverges).
- Input validated through the project's flow (validate middleware + schema) before reaching the handler; controller not re-validating or trusting raw input.
- Status codes correct (201 on create, 204 on delete-no-body, etc.).
- Pagination/filtering consistent with how other endpoints do it.

## DRY / convention (check against MODULE_REGISTRY.md)
- New util/middleware/helper/error-class that duplicates a registry entry or an existing file → flag with the existing path; recommend reuse.
- Copy-pasted logic across handlers that should be a shared helper or service method.
- Layout deviation: file placed outside the contract's structure.
- Import-convention deviation (e.g. missing `.js` extension where NodeNext requires it; not using the path alias).
- Paradigm deviation (class where the contract says functional, or vice versa) without reason.

## Performance & resources
- Expensive work (JSON parse of large payloads, sync crypto, heavy compute) on the request path that could be deferred/streamed.
- Unbounded concurrency (`Promise.all` over an unbounded user-supplied array).
- Leaks: timers/intervals/listeners not cleared; connections not released.
- Missing caching where the same expensive read repeats (only if the project already caches; don't over-engineer).

## Readability / maintainability (lowest priority, keep brief)
- Unclear names, dead code, commented-out blocks, oversized functions doing too much.
- Magic numbers/strings that should be named constants.
- Inconsistent style vs the surrounding module (defer to project norms, not personal taste).
