# Mapping Figma tokens → shadcn theme (Tailwind v4)

This is where extracted values become a working theme. shadcn's theme is a **fixed set of
semantic roles** stored as oklch CSS variables in `globals.css`, in three blocks: `:root`
(light), `.dark` (dark), and `@theme inline` (maps the variables to Tailwind utility names).
You re-value the roles; you don't rename them.

## The shadcn role set (map every Figma color onto these)

| Role (`--name`) | What it is | Typical Figma source |
| --- | --- | --- |
| `background` / `foreground` | page bg / default text | `bg/base`, `text/primary` |
| `card` / `card-foreground` | surface bg / text on it | `surface`, `bg/elevated` |
| `popover` / `popover-foreground` | menus/tooltips | usually = card |
| `primary` / `primary-foreground` | brand action + readable text on it | `brand/600`, `primary` |
| `secondary` / `secondary-foreground` | secondary surfaces/buttons | `neutral/100`, `brand/secondary` |
| `muted` / `muted-foreground` | subtle bg / secondary text | `bg/subtle`, `text/secondary` |
| `accent` / `accent-foreground` | hover/active emphasis | `brand/50`, accent ramp |
| `destructive` / `destructive-foreground` | danger/delete | `red/600`, `error` |
| `border` | hairlines, dividers | `border/default`, `neutral/200` |
| `input` | form control border/bg | `border/input` (often = border) |
| `ring` | focus ring | usually a tint of `primary` |
| `chart-1`..`chart-5` | data-viz series | chart/category palette |
| `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-accent`, `sidebar-border`, `sidebar-ring` | sidebar surface set | sidebar/nav tokens, else derive |

Rules of thumb:
- A `*-foreground` must be **readable on** its pair — usually Figma's text-on-color token; if
  absent, pick near-white or near-black by contrast.
- Map onto roles **before** inventing new tokens. Only add a custom token (e.g. `--brand-yellow`)
  when the design uses a raw color with no semantic job. Add custom tokens in the same blocks
  and expose them via `@theme inline` so they become utilities (`bg-brand-yellow`).

## The three blocks (Tailwind v4 shape)

Keep this structure; swap the values with your oklch output. `@theme inline` is what turns
`--primary` into the `bg-primary` / `text-primary` utilities and the shadcn `--color-*` names.

```css
/* globals.css */
@import "tailwindcss";
@import "tw-animate-css";        /* if present from scaffold */
@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;            /* from Figma corner radius; md ≈ 10px = 0.625rem */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.6231 0.188 259.81);        /* ← converter output */
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  /* ...chart-2..5, sidebar-* ... */

  /* extras this skill adds when Figma defines them: */
  --shadow-card: 0 1px 2px 0 oklch(0 0 0 / 0.05);
  --gradient-brand: linear-gradient(135deg, oklch(0.62 0.19 260), oklch(0.55 0.21 300));
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ...every role re-valued for dark; mirror the :root keys exactly... */
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ...one --color-* per role... */

  /* fonts: bind the next/font variables from layout.tsx (see fonts.md) */
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-display: var(--font-display);

  /* custom shadow/gradient utilities */
  --shadow-card: var(--shadow-card);
}
```

## Radius

Figma corner radius (px) → `--radius` (rem). shadcn derives `sm/md/lg/xl` from it via the
`@theme inline` `calc()` lines above, so set the base once. 8px → `0.5rem`, 10px → `0.625rem`,
12px → `0.75rem`, 16px → `1rem`. Don't hardcode radii on components — use `rounded-md`/`rounded-lg`.

## Shadows

Figma effect → `--shadow-<name>` token. Keep offset/blur/spread; convert the color to oklch
(usually black at low alpha). Expose in `@theme inline` so `shadow-card` works as a utility.
Tailwind v4 also reads `--shadow-*` for the built-in `shadow-*` scale if you'd rather override
those.

## Gradients

Define as a token: `--gradient-brand: linear-gradient(<angle>, <stop1>, <stop2>, ...)` with
each stop in oklch. Expose as a utility either via `@theme inline` (`--gradient-brand`) used
through `bg-[image:var(--gradient-brand)]`, or add a small utility class. Capture angle and
stops from `get_design_context`.

## Background images

If the system defines a recurring background (texture, hero pattern), export it with
`download_assets`, drop it in `public/`, and expose a token/utility
(`--bg-hero: url('/bg/hero.png')` → `bg-[image:var(--bg-hero)]`). Per-screen backgrounds belong
to the component skill, not here.

## Typography scale

Font **families** come from `next/font` variables (see `fonts.md`). The **size/line-height**
scale: if Figma defines a deliberate scale (Display/H1/H2/Body/Caption with specific
size+line-height+weight), encode it as theme tokens so the typography primitives
(`Text`/`Heading` from the bootstrap) and utilities use it consistently:

```css
@theme inline {
  --text-display: 3.5rem;        --text-display--line-height: 1.05;
  --text-h1: 2.25rem;            --text-h1--line-height: 1.15;
  --text-body: 1rem;             --text-body--line-height: 1.6;
}
```

These become `text-display`, `text-h1`, etc. Wire the bootstrap's `Heading`/`Text` cva variants
to them rather than scattering `text-[56px] leading-[1.05]`.
