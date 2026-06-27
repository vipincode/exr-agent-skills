# Dedup protocol (frontend)

The exact procedure to run before creating any potentially-shared code. This is what prevents the duplicate-component / duplicate-hook problem on the frontend.

## When this applies

Any time you're about to create: a component (card, modal, badge, chip, list, empty-state, skeleton, layout box, form field, typography element), a hook, a util/helper, a constant/enum/option-list, a type, a Zod schema usable by more than one place, an axios request wrapper, or a query-key root.

It does **not** apply to genuinely feature-local, single-use code — e.g. a private `formatPrice()` used only inside this module, or a one-off presentational sub-component of one screen. That stays in the feature and is not registered.

## The procedure

1. **Name the capability**, not the implementation. "a card that shows a product", "a confirm-before-delete modal", "a paged list query", "format cents → currency string", "a searchable single-select field" — capabilities, not "make a component called X".

2. **Consult the plan's Reuse section.** `frontend-feature-planner` already searched; treat its list (axios instance, BFF proxy, query-client, shared `*Field`, `useAuth`, existing feature/shared components) as the first candidates and verify each path still exists.

3. **Search MODULE_REGISTRY.md** for that capability among:
   - shared form fields (`components/shared/form/*` — InputField, SelectField, ComboboxField, …),
   - typography (`Text`/`Heading`/`Label`), overlay (`Modal`, future Drawer/Sheet/ConfirmModal), layout, data-display,
   - lib singletons (`axios`, `query-client`, `env`, `auth/*`, `cn`),
   - hooks (`useAuth`, …), services, and existing feature modules' public surfaces.

4. **Grep the codebase** (don't trust memory or the registry alone — the registry can lag):
   - `src/components/shared/**` for an existing wrapper (search by intent: `card`, `modal`, `dialog`, `badge`, `chip`, `empty`, `skeleton`, `Field`).
   - `src/components/ui/**` — never re-implement or fork a shadcn primitive; compose it.
   - `src/lib/**`, `src/hooks/**`, `src/services/**` for shared infra/util/hook.
   - sibling `src/features/*/` for a component/hook that already does it — but you may **not** cross-import another feature (see step 5).

5. **Decide:**
   - Exact match in shared/lib/hooks → import and use it. Done.
   - Close match → extend the shared piece (add a prop / `cva` variant) rather than fork, *unless* extending would bloat it with unrelated concerns — then create a sibling and note why.
   - **The thing lives in another feature** → it's not feature-local; **move it** to `components/shared` (or `lib`/`hooks`/`services`) and import from there. Never cross-import `features/<other>/` and never copy-paste it.
   - No match → create it, placed by the rule below, and flag it for registration if shared.

6. **Placement rule for anything new (decided by what it depends on):**
   - Depends on a single feature's domain (its types/hooks/api) → `features/<name>/components/`. Feature-local, registered only as part of the feature's public surface.
   - Generic / domain-agnostic (could serve a second feature) → `components/shared/<group>/` (form / typography / overlay / layout / data-display), composing `ui/` primitives. Register it immediately.
   - Reusable non-component (util/hook/type) → `lib` / `hooks` / `services`, registered.

7. **Record the outcome** for the hand-off summary: "reused X from `<path>`" or "created new shared Y at `<path>` (registered)".

## Anti-patterns to refuse

- Re-implementing a shadcn `ui/*` primitive (a new `Button`/`Dialog`/`Input`) instead of composing it.
- A second `Card`/`Modal`/`Badge`/`EmptyState`/`Skeleton` per feature when a shared one exists (or should).
- A raw `<input>` + `useController` in a page instead of the shared `*Field`; hand-rolled validation error text instead of the field's built-in error.
- A bespoke `fetch()` / a new axios instance / calling the backend's absolute URL — the one `api` instance + BFF is the only path.
- Server state via `useEffect` + `useState` + `fetch` instead of a TanStack Query hook.
- A parallel hand-written interface duplicating a `z.infer` type.
- Copy-pasting a component out of another feature "because this feature is different" instead of moving it to `shared`.
