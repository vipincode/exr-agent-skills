# Question banks by feature type

Scoped questions per common feature type. **Always filter these against what ARCHITECTURE.md, MODULE_REGISTRY.md, and the codebase already answer** — ask only what survives. These are the product/design decisions code cannot infer, not generic boilerplate.

## Auth (login / register / sessions)
- Token transport: bearer header, httpOnly cookie, or both? (the shipped `protect` supports both; this picks the default the endpoints set)
- Role model: single `role` string, or RBAC role list / permissions?
- Registration: open self-serve, invite-only, or admin-created?
- Refresh strategy: refresh-token rotation, or access-only short tokens?
- Password reset / email verification in scope now, or later?
Reuse check: `jwt.ts`, `protect`, `requireRole` almost always already exist — confirm, don't redesign.

## Resource CRUD (products, posts, orders…)
- Ownership: global, per-user, or per-tenant/org? (drives query scoping + auth guards)
- Soft delete vs hard delete?
- List endpoint needs: pagination (offset vs cursor), filtering, sorting, search?
- Any state machine (e.g. order status), or flat fields?
- Which operations are public vs guarded, and by which role?

## File / media upload
- Storage target: local disk, S3-compatible, or a provider already in the registry?
- Direct upload vs presigned URL?
- Allowed types / size limits / validation rules?
- Is the file owned by a resource (attach to product/user) or standalone?

## Search / listing-heavy
- Mongo query/text index, or an external engine?
- Pagination style (cursor preferred for large sets)?
- Facets/filters required, or simple keyword?

## Third-party integration (payments, email, webhooks…)
- Which provider, and is a client/SDK already registered in MODULE_REGISTRY.md?
- Inbound webhooks (need signature verification + raw-body handling) or outbound calls only?
- Idempotency requirements?
- Secrets: which new env vars (must be added to env schema + .env.example)?

## Cross-cutting (applies to most features)
- Does this introduce a genuinely new shared util/middleware (→ goes to registry), or is everything module-local?
- Any new env vars?
- Does it depend on another module's service (name the service, not the model)?
