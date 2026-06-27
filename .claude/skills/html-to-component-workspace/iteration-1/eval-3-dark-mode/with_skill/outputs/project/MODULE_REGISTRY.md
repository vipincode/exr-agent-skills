# Module Registry

The dedup ledger. Every reusable shared component, hook, and util is listed here. **Check here before creating anything.** Register new shared components immediately.

## Shared components

| Component | Path | Wraps / composes | Purpose |
| --- | --- | --- | --- |
| Header | components/shared/layout/header.tsx | composes ui/button + Logo | site header / top nav; variants size (`md`/`sm`), theme (`light`/`dark`) |
| Logo | components/shared/brand/logo.tsx | inline SVG | brand mark; `variant` mono/color |
| Container | components/shared/layout/container.tsx | — | max-width page container |
| Sidebar | components/shared/layout/sidebar.tsx | `next/link` + sidebar-* tokens | vertical nav rail; `items` prop with active state |
| StatCard | components/shared/data-display/stat-card.tsx | card/border tokens + cva | metric card (label/value/delta); `trend` up/down for delta color |
| Button | components/ui/button.tsx | shadcn primitive | base button |

## Hooks / utils

| Name | Path | Purpose |
| --- | --- | --- |
| cn | lib/utils.ts | className merge (clsx + tailwind-merge) |

## Decisions log
- Theme/fonts: applied from `_docs/designs/dashboard-dark.html` — Inter (next/font/google), indigo brand primary, slate neutrals, `--radius` 0.75rem, all colors oklch. Light (`:root`) + dark (`.dark`) both from the design's own dual-mode palette. Added custom `--positive` (delta) and full `--sidebar-*` role set.
- Dashboard (sidebar + stat cards) built from the same design: `Sidebar` + `StatCard` shared components composed in `features/dashboard/template/`.
