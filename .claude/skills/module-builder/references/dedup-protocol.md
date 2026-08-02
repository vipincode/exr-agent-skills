# Dedup protocol

The exact procedure to run before creating any potentially-shared code. This is what prevents the
duplicate-util and duplicate-component problem.

The **procedure is the same in both domains** — only the search targets, placement rules, and
anti-patterns differ. Read the shared procedure, then the section for the domain you're building.

## When this applies

Any time you're about to create something that could serve a second caller:

- **Backend** — a utility function, a middleware, a type usable in more than one place, a
  constant/enum, a validation helper, an error class, a response helper, a model, or an
  integration client.
- **Frontend** — a component (card, stat card, modal, badge, chip, tag, progress bar, divider,
  data table, list, empty state, skeleton, layout box, form field, typography element), an icon, a
  hook, a util, a constant/enum/option list, a type, a schema usable in more than one place, an
  HTTP request wrapper, or a query-key root.

It does **not** apply to genuinely single-use code — a private `mapDoc()` used inside one service,
a `formatPrice()` used only in this feature, a one-off presentational sub-component of one screen.
That stays local and is not registered. Over-sharing is its own failure mode.

## The shared procedure

1. **Name the capability, not the implementation.** "verify a JWT", "paginate a query", "check a
   role", "a card that shows a product", "a confirm-before-delete modal", "format cents → currency".
   Capabilities are searchable; "make a function called X" is not.

2. **Consult the plan's Reuse list.** `module-planner` already searched — treat its entries as the
   first candidates, and verify each path still exists before importing it.

3. **Search `MODULE_REGISTRY.md`** for that capability, among shared pieces and existing
   modules' public surfaces.

4. **Grep the codebase.** The registry can lag behind the code, so never trust it alone. Search by
   likely identifiers *and* by intent (`paginate`, `pageSize`, `cursor` for pagination;
   `jwtVerify`, `verifyToken` for token checks; `card`, `modal`, `dialog`, `empty`, `skeleton`,
   `Field` for UI).

5. **Decide:**
   - **Exact match** → import it. Done.
   - **Close match** → extend the shared piece (a parameter, an option, a variant) rather than
     fork it — *unless* extending would bloat it with unrelated concerns, in which case create a
     sibling and note why.
   - **It lives in another module/feature** → backend: call the owning module's **service**, never
     reach into its model. Frontend: it isn't feature-local after all — **move it** to the shared
     location and import from there. Never cross-import another feature, never copy-paste it.
   - **No match** → create it, placed by the rules below, and flag anything shared for
     registration.

6. **Record the outcome** for the hand-off summary: "reused X from `<path>`" or "created new shared
   Y at `<path>` (registered)". Paths, not categories — the summary is the evidence the gate ran.

---

## Backend

**Search:** `src/lib/` and `src/middleware/` for shared infra; `src/types/` and `src/constants/`
for shared types and constants; sibling `src/modules/*/` for a service that already does it.

**Placement for anything new:**

| Kind | Goes to |
|---|---|
| Reusable util/helper | `src/lib/` — registered |
| Reusable middleware | `src/middleware/` — registered |
| Type used (or usable) by 2+ modules | `src/types/` — registered |
| Constant/enum used by 2+ modules | `src/constants/` — registered |
| Single-use type / constant / helper | the module's `<name>.types.ts` / `<name>.constants.ts` / `<name>.utils.ts` — not registered |

Never as inline magic literals or ad-hoc inline types.

**Anti-patterns to refuse:**

- Re-implementing token signing/verification when the JWT helper exists.
- A second response-envelope helper, or a bare `res.json({...})` success shape.
- A per-module `catchAsync`/`asyncHandler` wrapper on Express 5 (unnecessary, and the contract
  forbids it).
- A new error class duplicating an existing `AppError` subclass.
- Copy-pasting a validation or pagination helper "because this module is different".
- Re-declaring an enum/status list another module already exports — one definition, in
  `src/constants/` if 2+ modules use it.
- Magic literals in service/controller code that should be a named constant.
- A new `User`-like model when one already exists — extend or reference it.

---

## Frontend

**Search:** `src/components/shared/**` for an existing wrapper; `src/components/ui/**` (never
re-implement or fork a primitive — compose it); `src/lib/**`, `src/hooks/**`, `src/services/**`
for shared infra; `src/types/**` and `src/constants/**`; sibling `src/features/*/` — but see the
cross-import rule in step 5.

**Placement is decided by what the new thing depends on:**

| Depends on | Goes to |
|---|---|
| One feature's domain (its types/hooks/api) | `features/<name>/components/` — part of that feature's public surface |
| Nothing domain-specific (could serve a second feature) | `components/shared/<group>/` (form / typography / overlay / layout / data-display), composing `ui/` primitives — registered immediately |
| Reusable util / hook / service | `lib/` / `hooks/` / `services/` — registered |
| Type used by 2+ features | `src/types/` — registered |
| Constant / enum / option list used by 2+ features | `src/constants/` — registered |
| Single-feature types & constants | the feature's `types/` and `constants/` files — not registered |

`components/ui/` holds generated primitives **only** — nothing hand-written goes there.

When you do create a component, style it the way the pieces beside it are styled: merge and group
utility classes with the project's `cn()` helper rather than template-string concatenation, and
express visual variants declaratively (e.g. `cva`) rather than boolean-ternary chains or
prop-keyed className maps. That keeps variants readable and lets caller overrides compose cleanly.

**Anti-patterns to refuse:**

- Re-implementing a `ui/*` primitive (a new `Button`/`Dialog`/`Input`) instead of composing it. A
  purely visual difference belongs as a variant on the primitive — not a forked file, not repeated
  `className` overrides at every call site.
- A second `Card`/`Modal`/`Badge`/`EmptyState`/`Skeleton` per feature when a shared one exists.
- Importing icons straight from the icon package, or pasting an inline `<svg>`, when the project
  has an icon registry — append the export there and import from it.
- Repeating a raw shadow/border/gradient value the theme already exposes as a token.
- A raw `<input>` wired by hand instead of the shared field components; hand-rolled validation
  error text instead of the field's built-in error.
- A bespoke `fetch()`, a second HTTP instance, or the backend's absolute URL — the one configured
  instance (through the BFF, when the project has one) is the only path.
- Server state via `useEffect` + `useState` + `fetch` instead of a query hook.
- A parallel hand-written interface duplicating an inferred schema type.
- Copy-pasting a component out of another feature instead of moving it to shared.
- Re-declaring an enum/option list another feature already exports.
- Magic literals or inline object shapes in components that should be a named constant or type.
