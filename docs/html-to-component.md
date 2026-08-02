# html-to-component

Turns an **HTML file, pasted markup, or live URL** into a production-grade Next.js + Tailwind + shadcn/ui design. The HTML counterpart to `figma-to-component`. Works in two phases:

## What it does

- **Phase 1 — Theme:** extracts the design's tokens (colors → oklch, typography, fonts, radius, shadows, gradients, background images) and applies them to `globals.css` + `layout.tsx`.
- **Phase 2 — Components:** converts the markup into components with a **dedup-first** approach — scans `MODULE_REGISTRY.md` and the shared/feature trees, reuses what exists, places generic pieces in `components/shared` and domain-specific ones in `features/<name>/components`, and registers new shared components.

## Example prompts

- "Convert `_docs/designs/landing.html` to Next.js"
- "Turn this HTML section into components" (+ pasted HTML)
- "Build this page in our app: https://example.com/pricing"

## Important

- Looks for design files in **`_docs/designs/`** by default — drop your HTML there.
- Builds **into an existing** Next.js + shadcn project; it does not scaffold (that's `nextjs-bootstrap`).
- You can run just one phase ("only extract the theme" / "theme is done, just build the components").
- Builds the design with sample data — API wiring is `module-planner` → `module-builder`.
