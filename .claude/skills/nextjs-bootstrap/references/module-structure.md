# Feature modules & the shared-component rule

These are **strict, project-wide conventions** — every skill that writes into this project (this
bootstrap, `module-planner`, `module-builder`, `code-review`, and the design builders
`figma-to-component`, `html-to-component`, `project-to-component`) MUST follow them. They are the load-bearing rules that keep the app DRY and
predictable, so they live here as the single source and are mirrored into the generated
`ARCHITECTURE.md`. When in doubt, this file wins.

## A feature is a self-contained module

Every domain (auth, products, orders, …) is one folder under `src/features/<name>/`. The folder owns
**everything that belongs only to that domain** — nothing domain-specific leaks into the global tree.
Fixed anatomy:

```
features/<name>/
  types/         domain TypeScript types/interfaces (or types.ts if small)
  constants/     domain constants, enums, option lists, query-key roots (or constants.ts)
  hooks/         domain hooks — including TanStack Query/mutation hooks for this module
  api/           request functions hitting the BFF for this module (callers of lib/axios)
  schema/        Zod schemas for this module's forms/payloads (types via z.infer)
  components/    components that depend ONLY on this module (see the rule below)
  template/      full composed views/screens for this module — login, register, forgot-password, …
  index.ts       barrel re-exporting the module's public surface
```

Notes:
- **`template/`** holds the assembled, page-level pieces (e.g. `login.tsx`, `register.tsx`,
  `forgot-password.tsx`). App Router `page.tsx` files stay thin: a route renders a template. This keeps
  routing and composition separate and lets a screen be reused across routes.
- `types/`, `constants/`, `hooks/` may be a single file (`types.ts`) or a folder with a barrel —
  pick by size, stay consistent within a module.
- A module imports freely from `components/shared`, `lib`, `hooks` (global), `services`, `types`
  (global), and `constants` (global). It must **not** import from another `features/<other>/` folder —
  if two features need the same thing, that thing is shared (see below), not cross-imported: components
  move to `components/shared`, utils/hooks to `lib`/`hooks`/`services`, types to `src/types/`,
  constants/enums to `src/constants/` — and get registered.

## The shared-vs-feature component rule (strict)

There are exactly two homes for a non-primitive component, decided by **what it depends on**:

- **`features/<name>/components/`** — a component that depends on a single module (its types, its
  hooks, its API, its domain logic). Example: `UserRoleSelect`, `ProductPriceTag` reading product
  domain types. It stays here until a *second* feature genuinely needs it.
- **`components/shared/`** — a component that is **generic / domain-agnostic** and is (or will be)
  reused across modules: wrappers, boxes, layout containers, **modal wrappers** (a shadcn-Dialog
  wrapper that takes only inner content), cards, chips, tags, badges, etc. If it doesn't depend on any
  one feature's domain, it is shared — full stop.

When a feature-local component turns out to be reused by a second feature, **move it to
`components/shared` and register it** in `MODULE_REGISTRY.md`. Never copy it.

`components/ui/` (shadcn primitives) sits below both: shared and feature components **compose**
primitives, never fork or re-skin them. (Restyling a primitive's `cva` variants in place to match
the design system — e.g. re-valuing or adding `button` variants — is sanctioned theming, not a fork.)

## Shared component taxonomy (`components/shared/`)

Shared components are grouped by purpose so they're discoverable (and so dedup checks are fast). The
bootstrap ships `form/`, `typography/`, and `overlay/` (with the `Modal` wrapper as the canonical
example); later skills fill the rest following the same shape (a folder + barrel + registry rows).

| Subfolder | What lives here | Shipped at bootstrap |
| --- | --- | --- |
| `form/` | RHF `*Field` components (the only field UI) | ✅ all `*Field` |
| `typography/` | `Text`, `Heading`, `Label` (cva) | ✅ |
| `overlay/` | `Modal` (Dialog wrapper, inner content only), future `Drawer`/`Sheet`/`ConfirmModal` | ✅ `Modal` |
| `layout/` | `Wrapper`, `Box`, `Container`, `Section`, `Stack` | ⬜ future skills |
| `data-display/` | `Card`, `Chip`, `Tag`, `Badge` wrappers, lists, empty states | ⬜ future skills |
| `feedback/` | alerts, banners, skeletons, to-style helpers | ⬜ future skills |

Every shared component: composes `ui/` primitives, takes `cva` variants where it has visual variants,
exposes a barrel in its subfolder, and gets a `MODULE_REGISTRY.md` row the moment it exists.

## The Modal wrapper (the shipped example of the shared rule)

`components/shared/overlay/modal.tsx` is the reference shared component. It wraps shadcn's `Dialog` so
callers pass **only the inner content** (plus optional `title`/`description`/`footer`/`trigger`),
never the `Dialog`/`DialogContent` plumbing. Feature code renders `<Modal>`; it does not re-wire the
Dialog primitive. Build new overlay wrappers (Drawer, Sheet, ConfirmModal) beside it the same way.
Requires the shadcn `dialog` primitive.

## Why these rules exist

- A feature folder you can delete in one move = no orphaned domain code scattered across the tree.
- One home per component decided by dependency = no "is this in shared or in the feature?" guessing,
  and no duplicate cards/modals/badges per feature.
- Templates separate from routes = screens are reusable and `page.tsx` stays a thin entry point.
- Future skills reading one rule set = consistent output no matter which skill writes the code.
