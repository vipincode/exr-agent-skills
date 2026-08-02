# Question banks — only the genuine unknowns

Scoped questions by module type. **Always filter these against what `ARCHITECTURE.md`,
`MODULE_REGISTRY.md`, the codebase, and any `prd-creator` brief already answer** — ask only what
survives. These are the product and UX decisions code cannot infer, not boilerplate.

Aim for **≤4 questions total**, presented as quick choices. Anything the user already specified is
answered. Anything the observed API settles (the server only supports paged queries) is answered
too — state it as a decision, not a question.

## Never ask these — the contract already decided them

Asking any of these signals the contract files weren't read properly:

- How the browser reaches the backend (BFF proxy vs direct) — `ARCHITECTURE.md`.
- Which HTTP client, which validation library, where types come from.
- How server state is managed, or what shape query keys take.
- Which form components to use, or how validation errors render.
- The success/error envelope shape.
- How tokens are verified, when auth primitives already exist in the registry.
- Which paradigm/layout new files follow.

## Auth (login / register / sessions)

- Token transport: bearer header, httpOnly cookie, or both? (Guards usually support both; this
  picks what the endpoints set by default.)
- Role model: single `role` string, or an RBAC role/permission list?
- Registration: open self-serve, invite-only, or admin-created?
- Refresh strategy: refresh-token rotation, or access-only short-lived tokens?
- Password reset / email verification in scope now, or a Later slice?
- UI gating for guarded actions: hide, disable, or route-guard the page?

Reuse check: JWT helpers, `protect`, `requireRole` almost always exist already — confirm, don't
redesign.

## Resource CRUD (products, posts, orders…)

- Ownership: global, per-user, or per-tenant/org? (Drives query scoping and guards.)
- Soft delete vs hard delete?
- List needs: pagination (offset vs cursor), filtering, sorting, search — and server-side or
  client-side?
- Any state machine (order status), or flat fields?
- Which operations are public vs guarded, and by which role?
- Which destructive actions need a confirm step?
- Cache strategy on writes: optimistic update with rollback, or invalidate-on-success and refetch?
- Post-success behavior: toast, redirect, close modal, reset form?

## Lists & collections (frontend shape)

- Pagination style: paged, infinite scroll, or load-all? (Drives the query key and hook shape.)
- Tabular data: plain table markup, or a sortable/pageable data table?
- Empty and loading UI: skeleton vs spinner; empty-state copy and CTA.

## Detail / single resource

- Fetch trigger: route param on a detail page, or on-demand in a modal/drawer?
- Not-found handling: a 404 page, a redirect, or an inline message?

## Forms

- Field ↔ schema mapping: which design inputs map to which request-body fields, and which are
  create-only vs editable. (The form stack is fixed by the contract; only the mapping is open.)

## File / media upload

- Storage target: local disk, S3-compatible, or a provider already in the registry?
- Direct upload vs presigned URL?
- Allowed types, size limits, validation rules?
- Owned by a resource (attached to a product/user) or standalone?

## Search / listing-heavy

- Database query/text index, or an external engine?
- Pagination style (cursor preferred for large sets)?
- Facets and filters, or simple keyword?

## Third-party integration (payments, email, webhooks…)

- Which provider, and is a client/SDK already registered?
- Inbound webhooks (signature verification + raw-body handling) or outbound calls only?
- Idempotency requirements?
- Which new env vars — they must reach the env schema and `.env.example`.

## Cross-cutting (most modules)

- Does this introduce a genuinely new shared piece (→ registry), or is everything module-local?
- Does it depend on another module's service? Name the service, not the model.
- Existing route/screen, or a new one?
- Which capabilities are MVP vs Later? (Later ones become deferred slices, still planned, marked
  as such in the build order.)
