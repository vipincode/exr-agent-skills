# Module Registry

The dedup ledger. Every reusable shared component, hook, and util is listed here. **Check here before creating anything.** Register new shared components immediately.

## Shared components

| Component | Path | Wraps / composes | Purpose |
| --- | --- | --- | --- |
| Header | components/shared/layout/header.tsx | composes ui/button + Logo | site header / top nav; variants size (`md`/`sm`), theme (`light`/`dark`) |
| Logo | components/shared/brand/logo.tsx | inline SVG | brand mark; `variant` mono/color |
| Container | components/shared/layout/container.tsx | — | max-width page container |
| Button | components/ui/button.tsx | shadcn primitive | base button |

## Hooks / utils

| Name | Path | Purpose |
| --- | --- | --- |
| cn | lib/utils.ts | className merge (clsx + tailwind-merge) |

## Decisions log
- Theme/fonts: applied from `_docs/designs/landing.html`. Primary = indigo `#4f46e5`; neutrals = slate scale; accent = violet-100; oklch throughout. Fonts: Inter (sans/body), Poppins (display/headings), Geist Mono (mono). Added `--shadow-button`, `--shadow-card`, `--gradient-brand`. Dark mode derived (source is light-only). Files: `src/app/globals.css`, `src/app/layout.tsx`.
