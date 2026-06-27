# Reading a Figma frame for code

Four MCP read tools, used in a deliberate order: structure first, then code, then pixels, then
tokens. Don't dump a huge frame in one call — decompose top-down.

## Get a node-specific URL

Tools need `fileKey` + `nodeId` from the URL
(`figma.com/design/<fileKey>/<name>?node-id=1-2` → `fileKey`, `nodeId = 1:2`). No `node-id`?
Call `get_metadata` with only `fileKey` to list pages, then drill in — or ask the user for the
specific frame link.

## 1. `get_metadata` — the decomposition map (start here for big frames)

Returns the layer tree in XML: node ids, names, types, positions, sizes — **no styles**. This
is your structural overview. Use it to:
- See the frame's children and identify the discrete components (a child named "Header",
  "Hero", "Card", "Sidebar" is your candidate list).
- Grab the **child node ids** so you can call `get_design_context` on each piece individually
  instead of pulling the whole frame at once (cheaper, and it keeps each component focused).

Layer **names matter** — designers name a header "Header". Treat names as the primary hint for
the dedup search (shared-taxonomy.md) and for what to call the component.

## 2. `get_design_context` — the reference code + assets

The primary design-to-code tool: returns reference code, a screenshot, and asset download
URLs for a node. Call it **per component node** (from the ids in step 1) for anything
non-trivial.

How to use the response:
- It's a **reference, not paste-able output.** Harvest layout (flex/grid, gaps, padding),
  sizes, colors, radii, typography — then re-express them as Tailwind utilities + theme tokens
  (building-components.md). Don't ship its raw markup/classes.
- Note the **asset URLs / image fills** — those drive `download_assets` (step 4-assets below).
- If it returns Code Connect mappings (the project has `.figma.tsx` files mapping design
  components to code), **honor them** — that's an explicit "use this existing component" signal,
  the strongest possible dedup hint.

## 3. `get_screenshot` — visual truth

Pull a screenshot of the frame and of individual components. Use it to:
- Verify your decomposition (what are the real visual blocks).
- Check details the code reference flattens — overlap, shadow softness, gradient direction.
- Compare against your built output at the end.
Bump `maxDimension` when you need to read fine detail (default 1024).

## 4. `get_variable_defs` — use the theme, don't hardcode

Returns the variables bound in the node (`color/primary/600`, `radius/md`, `font/family/*`).
These tell you **which theme token** a value corresponds to — so instead of translating a raw
`#3B82F6` you can see it's `primary` and write `bg-primary`. If the project was themed by
`font-theme-setup`, the variable names line up with the shadcn roles. Lean on this to stay
token-based.

## Exporting assets (`download_assets`)

For images, icons, logos, and background fills:
- Call `download_assets` on the node; it returns an exported render plus the original source
  images (with a `format` field for the right extension).
- Save under `public/` (global) or the feature folder, and render with `next/image`.
- Small, single-color icons → prefer inlining as SVG components (recolorable via
  `currentColor`/`text-*`), rather than image files.
- **Never hotlink** the temporary Figma URLs in committed code — they expire.

## Decomposition recipe

1. `get_metadata` on the frame → list children → candidate components.
2. For each candidate: dedup-protocol.md (reuse/extend/create). Skip building anything that
   already exists.
3. For each to-build: `get_design_context` on its node → values; `get_screenshot` → look;
   `get_variable_defs` → tokens; `download_assets` → images.
4. Build leaf/shared components first, then compose upward into the section/screen.
