# Output Summary

## Component created

**`Hero`** — a reusable marketing hero section converted from the provided HTML snippet.

| Item | Detail |
| --- | --- |
| Path | `src/components/shared/marketing/hero.tsx` |
| Barrel | `src/components/shared/marketing/index.ts` (new `marketing` group) |
| Type | Server Component |
| Composes | `ui/button` (CTA via `asChild` anchor) |
| Props | `title` (required), `subtitle?`, `ctaLabel?`, `ctaHref?` (default `#`), plus standard `HTMLAttributes` + `className` |

## Why here

A hero is a generic, reusable marketing component, so per `ARCHITECTURE.md` it lives under `components/shared/` — specifically a new `marketing/` group. `MODULE_REGISTRY.md` was checked first: no existing Hero, so a new one was created and registered.

## Styling notes

- Inline `style="…"` removed; replaced with Tailwind utilities (no separate CSS, no static inline styles), following project conventions.
- Brand colors are not in the (stock shadcn grayscale) theme tokens, so the closest Tailwind palette utilities were used: `#3b82f6` → `blue-500`, `#9333ea` → `purple-600`, `#e5e7eb` → `gray-200`.
- 135deg gradient → `bg-gradient-to-br from-blue-500 to-purple-600`.
- Spacing/sizes mapped to scale where clean (`py-24`=96px, `px-6`=24px, `mt-4`/`mt-8`, `text-lg`, `rounded-xl`); exact values kept as arbitrary where no token fits (`text-[56px] leading-[1.05]`, `px-7 py-3.5`).
- Heading uses `font-display` (matching the existing `Header` convention). Poppins is a font/theme concern (font-theme-setup), out of scope here — no font wiring changed.

## Files touched

- `src/components/shared/marketing/hero.tsx` — new
- `src/components/shared/marketing/index.ts` — new barrel
- `src/app/page.tsx` — renders `<Hero />` as a working demo with the snippet's content
- `MODULE_REGISTRY.md` — registered the `Hero` shared component
