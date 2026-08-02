# How to cut a module into slices

Slicing is the judgment call that decides whether the plan is useful. A well-sliced module lets the
user build for an hour, see something work, and stop. A badly sliced one recreates the problem
sharding was meant to solve.

## The rule

**A slice is one vertically shippable capability.** Enough backend and enough frontend that when
it's built, something is demoable. Not a layer, not a file, not a phase.

Test any candidate slice against three questions:

1. **Can I demo it?** If finishing it produces nothing a person could look at or call, it's not a
   slice.
2. **Can I write its "Done when" in one sentence?** If the sentence needs an "and also", it's two
   slices.
3. **Could I build it in one sitting?** If not, split. If it feels too small to be worth a file,
   merge it into its neighbour.

## The three failure modes

### Horizontal slicing (by far the most common)

```
✗ 01-user-model.md
✗ 02-auth-endpoints.md
✗ 03-auth-ui.md
```

This is layer-slicing wearing slice clothing. None of the three is demoable alone, the user can't
checkpoint anywhere, and slice 03 inherits every mistake in 01 and 02 at once. It also splits the
contract across files, which is exactly the drift the plan is structured to prevent.

The data model is the usual trigger — it feels like a prerequisite, so it wants its own slice.
Resist it. **The model belongs to the master plan** (its own section), and gets created by whichever
slice first needs it, normally 01. The plan documents it once; slice 01 builds it as part of
shipping register.

### Too thin

```
✗ 03-password-strength-validation.md
✗ 05-reset-email-template.md
```

These are tasks inside a slice, not slices. A useful heuristic: **if it has no endpoint of its own,
it's probably not a slice.** Password strength is part of register; the reset email is part of
forgot-password.

Twelve slices for one module means you sliced too thin — the overhead of the files exceeds the
benefit of the checkpoints.

### Too fat

```
✗ 01-auth.md        (register + login + logout + refresh + reset, all in one)
```

That's the whole module, which is what sharding exists to break up. Split when a slice has more
than roughly **5 endpoints**, touches more than a couple of screens, or you can't picture finishing
it in a sitting.

One slice for a module means it wasn't a module — fold it into a related one.

## Ordering

**Dependency first, demo value second.**

- Slice 01 establishes the foundation: it creates the model and sets the patterns (auth guard
  style, envelope usage, feature-module layout) that later slices copy. Everything after reuses it,
  so getting it right first is worth more than getting it done fast.
- After that, order by what unblocks the most remaining work. Login before logout; create before
  edit; list before detail.
- Where two slices are genuinely independent, put the higher-demo-value one first — the user gets a
  visible win earlier, and an unbuilt independent slice costs nothing.
- Record `Depends on` explicitly per slice, even when it's just the previous number. It's what
  lets the user safely reorder or skip.

**The numeric filename prefix is the order.** `01-`, `02-`, `03-`. A directory listing is then the
build plan, and there's no separate index file to fall out of sync.

## Worked examples

### Auth (fullstack, 4–5 slices)

```
auth-plan.md          data model (User), token transport, role model, reuse list
01-register.md        POST /auth/register + register form        → users can exist
02-login.md           POST /auth/login + login form + session    → users can get in
03-logout.md          POST /auth/logout + header menu action     → users can get out
04-forgot-password.md request + reset endpoints + both screens   → users can recover
05-refresh.md         refresh rotation + silent retry            (often deferred to Later)
```

Why register first: login needs users to exist to be demoable at all, and register is where the
User model, the password hashing choice, and the envelope pattern get established.

### Product catalog (fullstack, 4 slices)

```
product-catalog-plan.md   data model (Product), ownership, pagination style, reuse list
01-list-products.md       GET /products (paged) + grid + empty/loading/error
02-product-detail.md      GET /products/:id + detail page + not-found
03-admin-create-edit.md   POST/PATCH /products + admin form (role-gated)
04-delete-archive.md      DELETE /products/:id + confirm modal
```

Read-before-write is deliberate: the list slice establishes the schema, the envelope unwrap, and
the query-key namespace that every later slice reuses, and it's demoable with seeded data alone.

### Orders (fullstack, depends on other modules)

```
orders-plan.md        data model (Order), status state machine, depends on auth + catalog + cart
01-place-order.md     POST /orders + checkout submit         (depends: auth 02, cart)
02-my-orders.md       GET /orders + order history list
03-order-detail.md    GET /orders/:id + detail + status timeline
04-admin-status.md    PATCH /orders/:id/status + admin control (role-gated)
```

Note the cross-module dependency in the master plan. If cart doesn't exist yet, slice 01 is
`blocked` with the unblock path named — it still gets a file.

## Backend-only and frontend-only modules

The same rules apply, minus one half:

- A **webhook processor** (backend-only) slices by event type or by stage: `01-receive-verify`
  (endpoint + signature verification), `02-process-payment-succeeded`, `03-retry-dead-letter`.
  Demoable means "a real webhook payload gets a correct response".
- A **marketing site** (frontend-only) slices by page or section, and "demoable" is literal.

Tag each slice's `Domain` accordingly, and write `n/a` in the absent half rather than deleting the
heading — a consistent shape is what makes these files skimmable.

## Mixed design/observe modules

A module can design some endpoints and observe others. Decide **per slice** and record the source
in that slice's contract section:

- `01-list-products.md` — observes an existing `GET /products` from the running backend.
- `02-admin-create.md` — designs a new `POST /products` that doesn't exist yet.

Nothing about the file structure changes; only the "Source" line under the contract differs.
