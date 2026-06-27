# Question banks — only the genuine unknowns

Pick from these by feature type, then **filter against the frontend contract and the user's
request**. Ask only what survives — the contract already answers transport (BFF + axios),
validation (Zod), server-state (TanStack Query), and form UI (shared `*Field`), so never ask
those. Aim for ≤3–4 real decisions, presented as quick choices.

## Always candidates (any binding)
- **Scope of this binding** — list, detail, create/edit, delete, or a combination? (Decides which
  hooks and screens.)
- **Existing route or new one** — does this feed an already-built screen/route, or a new
  `app/<name>/page.tsx`?
- **Auth gating in the UI** — for guarded mutations (admin-only etc.), hide the action, disable it,
  or route-guard the page via `proxy.ts`?

## Lists / collections
- **Pagination style** — paged, infinite scroll, or load-all? (Drives the query key + hook shape.)
- **Filtering / search / sort** — server-side (query params, observed from the API) or client-side?
- **Empty & loading UI** — skeleton vs spinner; empty-state copy/CTA.

## Mutations (create / update / delete)
- **Cache strategy** — optimistic update + rollback, or invalidate-on-success and refetch?
- **Invalidation scope** — which query keys does a successful write invalidate?
- **Confirmation** — which destructive actions need a confirm modal (shared overlay)?
- **Post-success** — toast, redirect, close modal, reset form?

## Detail / single-resource
- **Fetch trigger** — route param on a detail page, or on-demand (modal/drawer)?
- **Not-found handling** — 404 → notFound() page, redirect, or inline message.

## Forms (when the design has inputs)
- **Field ↔ schema mapping** — confirm which design inputs map to which request-body fields, and
  which are create-only vs editable. (The shared `*Field` set and Zod are fixed; only the mapping
  is a question.)

---

Anything the user already specified in their request is **answered** — honor it, don't re-ask.
Anything the observed API settles (e.g. the server only supports paged queries) is answered too —
state it as a decision, not a question.
