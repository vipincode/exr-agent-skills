# Animation: Tailwind/CSS first, framer-motion when it earns it

Only relevant when the design actually animates (a marked transition, a motion prototype, an
obviously animated component like a carousel or an accordion). Don't add motion the design
doesn't call for.

## Decision

| Need | Use |
| --- | --- |
| Hover/focus/active feedback, color/opacity/scale transitions | **Tailwind** `transition`, `duration-*`, `ease-*`, `hover:`/`focus:` |
| Enter/leave on simple toggles (dropdowns, dialogs, accordions) | **shadcn primitives** (built-in Radix data-state animations) + `tw-animate-css` if present |
| Looping/keyframe effects (spinner, pulse, marquee) | **CSS keyframes** via Tailwind (`animate-*`, custom `@keyframes` in globals.css) |
| Orchestrated sequences, gestures (drag), layout/shared-element, scroll-linked, spring physics | **framer-motion** (`motion/react`) |

Rule of thumb: if a CSS transition or a shadcn primitive's built-in animation does it, use that —
it's lighter and needs no client JS boundary. Bring in framer-motion when the motion is a
**designed feature**, not a nicety.

## Tailwind / CSS patterns

```tsx
// transition on interaction
<button className="transition-colors duration-200 hover:bg-primary/90 active:scale-[0.98]">

// reusable keyframe (define once in globals.css @theme/@keyframes, then use the utility)
<div className="animate-[marquee_20s_linear_infinite]">
```

shadcn primitives animate via `data-[state=open]`/`data-[state=closed]` — you usually get
enter/leave for free by composing `Dialog`/`Accordion`/`Popover`. The scaffold may include
`tw-animate-css`; prefer its utilities (`animate-in`, `fade-in`, `slide-in-from-*`) over
hand-rolled keyframes for entrances.

## framer-motion patterns

Install if absent (`<pm> add motion`; modern import is `motion/react`). The component must be a
Client Component (`"use client"`).

```tsx
"use client";
import { motion } from "motion/react";

// scroll/enter reveal
<motion.div
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-80px" }}
  transition={{ duration: 0.5, ease: "easeOut" }}
/>

// staggered children
<motion.ul variants={{ show: { transition: { staggerChildren: 0.08 } } }}
           initial="hidden" animate="show">
  {items.map((it) => (
    <motion.li key={it.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} />
  ))}
</motion.ul>
```

Guidelines:
- Respect reduced motion (`useReducedMotion()` or a `motion-reduce:` Tailwind fallback).
- Keep durations in the design's range (usually 150–500ms); don't over-animate.
- Don't wrap a whole static page in `motion` — animate the specific elements the design moves.

## Reading motion from Figma

If the Figma node has prototype/motion data, `get_design_context` may surface it or point you to
motion context. Honor the design's easing/duration/trigger when present; otherwise pick
tasteful defaults from the table above.
