# Shared vs feature, and the canonical shared list

Two homes for any non-primitive component, decided by **what it depends on** (this mirrors the
project's `module-structure` rule — it binds every frontend skill):

- **`components/shared/<group>/`** — **generic / domain-agnostic**: it could appear in any
  feature and doesn't import a feature's types/hooks/API. Headers, navbars, heroes, cards,
  avatars, carousels, charts, logos, banners, sidebars — the reusable furniture of the app.
- **`features/<name>/components/`** — depends on **one** feature's domain (its types, hooks,
  API, copy). E.g. `CheckoutSummary` reading cart types, `UserRoleBadge` reading the user
  module. Stays here until a *second* feature needs it, then it **moves** to shared.

`components/ui/` (shadcn primitives) sits below both — shared and feature components **compose**
primitives, never fork them.

## Canonical reusables → shared (these are almost always shared)

The user's list, plus common siblings. An HTML element or class with one of these names
(`<header>`, `class="hero"`, `class="navbar"`, `class="card"`) is a strong signal it's a shared
component. Map each to a `components/shared/` subfolder:

| Component | Subfolder | Notes / shadcn primitive to compose |
| --- | --- | --- |
| Header / Navbar / Topbar | `layout/` | compose `ui/navigation-menu`; variants for size/theme |
| Sidebar | `layout/` | shadcn ships a full `sidebar` primitive — `shadcn add sidebar`, compose it |
| Footer | `layout/` | |
| Hero / Small-hero | `marketing/` (or `layout/`) | one `Hero` with a `size`/`variant` prop, not two files |
| Banner / Announcement bar | `feedback/` | dismissible variant |
| Logo / Brand mark | `brand/` | inline SVG component; `variant` for mono/color/mark-only |
| Carousel / Slider | `data-display/` | `shadcn add carousel` (Embla), compose it |
| Charts (line/bar/area/pie) | `data-display/` | `shadcn add chart` (Recharts) — compose `ChartContainer` |
| Card (content/pricing/stat) | `data-display/` | compose `ui/card`; variants, don't fork per use |
| Avatar / Profile avatar | `data-display/` | `shadcn add avatar`; add `status`/`size` props |
| Chip / Tag / Badge | `data-display/` | compose `ui/badge` |
| Breadcrumbs / Pagination / Tabs | `navigation/` | shadcn ships these primitives |
| Modal / Drawer / Sheet | `overlay/` | bootstrap ships `Modal`; add `Drawer`/`Sheet` beside it |
| Empty state / Skeleton / Alert | `feedback/` | |
| Section / Container / Stack / Grid | `layout/` | layout wrappers, pure presentational |

> Subfolder names are a taxonomy, not a hard schema — `layout/`, `data-display/`, `overlay/`,
> `feedback/`, `navigation/`, `marketing/`, `brand/`, `form/`, `typography/`. Use the existing
> ones from the project first; add a new group folder (with a barrel) only when nothing fits.
> The bootstrap ships `form/`, `typography/`, `overlay/`; you'll be adding the rest.

## How to decide for anything NOT on the list

Ask: **"If I deleted feature X, would this component still make sense?"**
- Yes → it's generic → **shared**.
- No (it only means something inside feature X) → **feature**.

And: **"Does it import anything from `features/<x>/`?"**
- Yes → it's feature-coupled → **feature** (or refactor the coupling out and make it shared).
- No → it's a candidate for shared.

Borderline cases:
- A `StatCard` showing arbitrary `{label, value, delta}` → shared (`data-display/`). A
  `RevenueCard` that fetches the billing feature's data → feature.
- A `UserAvatar` that just renders an image+name+status from props → shared. One that reads the
  `auth` session hook internally → either feature, or keep it shared and pass data in as props
  (preferred — keeps it reusable).

Prefer **props over coupling**: a component that takes data via props stays shared and reusable;
one that reaches into a feature's hooks gets stuck in that feature. When a design component is
generic but the obvious implementation couples it, lift the data out to props.

## Every shared component

- Composes `ui/` primitives (never forks them).
- Takes `cva` variants where it has visual variants (size/tone/theme).
- Has a barrel (`index.ts`) in its subfolder.
- Gets a `MODULE_REGISTRY.md` row the moment it exists.
