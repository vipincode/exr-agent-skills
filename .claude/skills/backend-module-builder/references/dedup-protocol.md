# Dedup protocol

The exact procedure to run before creating any potentially-shared code. This is what prevents the duplicate-util problem.

## When this applies

Any time you're about to create: a utility function, a middleware, a type/interface used (or usable) by more than one place, a constant/enum, a validation helper, an error class, a response helper, a model, or an integration client.

It does **not** apply to genuinely module-local, single-use code (e.g. a private `mapDoc()` helper used only inside one service) — that stays in the module.

## The procedure

1. **Name the capability**, not the implementation. "verify a JWT", "paginate a query", "send an email", "check a role" — capabilities, not "make a function called X".

2. **Consult the plan's Reuse section.** backend-feature-planner already searched; treat its list as the first candidates and verify each path still exists.

3. **Search MODULE_REGISTRY.md** for that capability among shared pieces and existing modules' public surfaces.

4. **Grep the codebase** (don't trust memory or the registry alone — the registry can lag):
   - `src/lib/` and `src/middleware/` for shared infra.
   - sibling `src/modules/*/` for a service that already does it.
   - search by likely identifiers and by intent (e.g. `paginate`, `pageSize`, `cursor` for pagination; `jwtVerify`, `verifyToken` for token checks).

5. **Decide:**
   - Exact match → import and use it. Done.
   - Close match → extend the shared piece (add a param/option) rather than fork, *unless* extending would bloat it with unrelated concerns — then create a sibling and note why.
   - Cross-module data need → call the owning module's **service**, never reach into its model directly.
   - No match → create it. If it's reusable, place it in `src/lib` or `src/middleware` (not inside the module) and flag it for registration. If single-use, keep it module-local.

6. **Record the outcome** for the hand-off summary: "reused X from <path>" or "created new shared Y at <path> (registered)".

## Anti-patterns to refuse

- Re-implementing token signing/verification when `jwt.ts` exists.
- A second response-envelope helper or a bare `res.json({...})` success shape.
- A per-module `catchAsync`/`asyncHandler` wrapper (Express 5 makes it unnecessary, and ARCHITECTURE.md forbids it).
- A new error class that duplicates an `AppError` subclass.
- Copy-pasting a validation or pagination helper "because this module is different".
- A new `User`-like model when one already exists — extend or reference instead.
