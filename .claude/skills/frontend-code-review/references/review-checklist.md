# Frontend review checklist

Concrete things to look for per dimension. Use the contract to know the project's expected patterns; flag deviations from those, plus the universal issues below. Not every item applies to every file — judge relevance.

## Correctness & React
- **Hook dependency bugs**: `useEffect`/`useMemo`/`useCallback` with a missing or wrong dependency → stale closure (acts on old state/props) or an infinite loop (an unstable object/array/function in deps).
- **Conditionally-called hooks** (hook inside an `if`/loop/early-return) — breaks the rules of hooks.
- **List keys**: missing `key`, or array index as `key` on a list that can reorder/insert/delete → wrong reconciliation. Stable id required.
- **Derived state in effects**: `useState` + `useEffect` to compute a value that should just be computed during render (or `useMemo`). Effects that sync state create extra renders and bugs.
- **Unstable references** passed where identity matters: an inline `{}`/`[]`/arrow as a TanStack Query `queryKey`, a dep, or a memo input → refetch/recompute loops.
- **Async**: missing `await`, an unhandled rejection, awaiting in a loop where `Promise.all` is right, setting state after unmount without guarding.
- **Type holes**: `any`, unchecked `as` casts, non-null `!` hiding a real gap — especially on API response data.

## Component duplication & placement (DRY — check against MODULE_REGISTRY.md)
*(Headline concern for this toolkit.)*
- A new component/hook/util that **duplicates a registry entry** or an existing `components/shared` / `lib` / `hooks` / `services` piece → flag with the existing path; recommend importing it.
- A **re-implemented or forked shadcn `ui/` primitive** (a hand-rolled Button/Dialog/Input) instead of composing the CLI-managed one.
- **Wrong home** per the placement rule: a domain-specific component (depends on one feature's types/hooks) sitting in `components/shared`; or a generic, reusable component (card/modal/badge/empty-state) copy-pasted *inside* a feature instead of living in `components/shared/<group>`.
- **Cross-feature import**: `features/a/**` importing from `features/b/**`. The shared thing must be promoted to `components/shared`/`lib`/`hooks` and imported from there — never cross-imported, never copied.
- Copy-pasted JSX/logic across components that should be one shared component or hook.
- Duplicate type: a hand-written interface that re-declares a `z.infer` type (drift risk).

## API-binding conformance (the toolkit standard)
- **BFF only**: a browser-side request that bypasses the BFF — a raw `fetch()`/new axios instance hitting the backend's absolute URL, or reading `process.env.BACKEND_URL`/a server secret in client code. All client requests go through the shared `api` instance → same-origin `/api`.
- **Envelope unwrap + Zod**: the response is consumed raw (`res.data.data` typed as `any`, or the whole envelope passed to components) instead of being unwrapped and **parsed with the Zod schema**. Drift must fail loudly, not render silently. Flag responses typed `any`.
- **Server state in TanStack Query**: data fetched with `useEffect` + `useState` + `fetch`/axios instead of `useQuery`/`useMutation`. Manual loading/error booleans where Query gives them for free.
- **Query keys**: not arrays, or not namespaced by feature, or built from unstable inline objects; a key that won't invalidate/refetch correctly.
- **Mutations**: don't `invalidateQueries` (or update the cache) on success, so the UI goes stale; optimistic updates without an `onError` rollback.
- **States handled**: `isPending`/`isError`/empty-list each rendered. A binding that assumes success and crashes on error/empty, or shows a blank screen on empty, is a real bug.

## Forms & validation
- A field wired with raw `useController` / a bare `<input>`/`<select>` instead of the shared `*Field` set; hand-rolled error text instead of the field's built-in error.
- `useForm` without `zodResolver` (or validating ad-hoc); a form schema that drifts from the request schema.
- Types from a parallel interface instead of `z.infer<typeof schema>`.
- Submit not disabled while the mutation is pending (double-submit), or the mutation error not surfaced.
- Admin-only / gated actions present in the UI with **no real gate** (or gated only by hiding a button while the endpoint is still callable — note that the real authZ must be server-side; UI gating via `useAuth` is UX only).

## Next.js App Router
- `"use client"` on a component/page that doesn't need interactivity (pushes work + bundle to the client unnecessarily). Conversely, an interactive component (hooks/handlers) missing `"use client"`.
- Server-only values (secrets, server `process.env`, the backend URL) referenced in a client component → leaks to the bundle.
- `page.tsx` doing composition/business logic instead of staying thin and rendering a `template/` screen.
- Data fetched in the wrong place (a Server Component that should fetch on the server doing a client Query, or vice versa) — judge against the contract.
- Mixing Server/Client incorrectly: passing non-serializable props from a Server to a Client component; `async` Client components.

## Accessibility (practical, not a full WCAG pass)
- Click handlers on a `div`/`span` that should be a `button`/`a` (no keyboard/focus/role).
- Inputs without an associated `<label>` (or `aria-label`); icon-only buttons without an accessible name.
- `<img>`/`next/image` without meaningful `alt` (or missing `alt=""` for decorative).
- State conveyed by color alone (e.g. stock status) with no text/icon backup.
- Custom interactive widgets (menus, modals, comboboxes) that trap or lose focus — usually solved by using the shadcn primitive rather than a hand-roll.

## Performance & resources
- Unnecessary client components / large libs imported into client code, bloating the bundle.
- Expensive computation in render not memoized, or a heavy child re-rendering on every parent render (missing `memo`/stable props) — only when it actually matters on a hot path.
- Request waterfalls: sequential dependent `await`s that could be parallelized or prefetched; N requests in a loop.
- Missing `keepPreviousData`/`placeholderData` on paged lists causing a flash to empty on every page change.
- Leaks: `setInterval`/`setTimeout`/event listeners/subscriptions not cleared in the effect cleanup.

## Readability / maintainability (lowest priority, keep brief)
- Unclear names, dead code, commented-out blocks, oversized components doing too much (split into template + presentational + hook).
- Magic numbers/strings that should be named constants or come from the schema.
- Inconsistent style vs the surrounding module — defer to project norms, not personal taste.
