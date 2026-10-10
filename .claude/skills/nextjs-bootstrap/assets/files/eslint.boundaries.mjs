import { existsSync, readdirSync } from "node:fs";

// ---------------------------------------------------------------------------
// Architecture boundaries for the Next.js app, enforced by lint so they hold no
// matter who (or which AI) writes the code. Each rule mirrors an invariant in
// ARCHITECTURE.md; change both together. Spread into eslint.config.mjs:
//
//   import boundaries from "./eslint.boundaries.mjs";
//   export default defineConfig([...nextVitals, ...nextTs, ...boundaries, globalIgnores([...])]);
//
// Uses only core ESLint rules (no plugin). A later block replaces the rule's
// options for the files it matches, so every block lists its full pattern set.
// ---------------------------------------------------------------------------

const rule = (regex, message) => ({ regex, message });
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const FEATURE_INTERNALS = rule(
  "^@/features/[^/]+/.+",
  "Import a feature only through its barrel: `@/features/<name>` (its index.ts).",
);
const ANY_FEATURE = rule(
  "^@/features(/|$)",
  "Shared layers (components, lib, hooks, services, types, constants) must not depend on a feature. Move the piece into a shared folder instead.",
);
const APP_DIR = rule("^@/app(/|$)", "Nothing imports from src/app — routes are entry points, not libraries.");
const SHARED_FROM_UI = rule(
  "^@/components/shared(/|$)",
  "components/ui primitives sit below components/shared — never import upward.",
);
const ICON_LIBS = rule(
  "^(lucide-react|react-icons)(/|$)",
  "Import icons from @/components/shared/icons (the icon registry), never from the icon library directly.",
);
const AXIOS = rule("^axios$", "Use the shared `api` instance from @/lib/axios — never a second HTTP client.");

const otherFeature = (name) =>
  rule(
    `^@/features/(?!${escape(name)}(/|$))`,
    "A feature never imports another feature. Move the shared piece to components/shared, lib, hooks, services, types, or constants — and register it.",
  );
const leavesFeature = (depth) =>
  rule(
    `^(\\.\\./){${depth + 1}}`,
    "This relative import leaves the feature folder. Use the `@/` alias for shared code — and never reach into another feature.",
  );

const restrict = (...patterns) => ({ "no-restricted-imports": ["error", { patterns }] });
const TS = "*.{ts,tsx}";
const SHARED_LAYERS = ["components", "lib", "hooks", "services", "types", "constants"].map((d) => `src/${d}/**/${TS}`);
const MAX_DEPTH = 6;

// Feature folders that exist right now (re-read on every lint run).
const featuresDir = new URL("./src/features", import.meta.url);
const features = existsSync(featuresDir)
  ? readdirSync(featuresDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : [];

const featureBlocks = features.flatMap((name) =>
  Array.from({ length: MAX_DEPTH + 1 }, (_, depth) => ({
    files: [`src/features/${name}/${"*/".repeat(depth)}${TS}`],
    rules: restrict(otherFeature(name), leavesFeature(depth), ICON_LIBS, AXIOS),
  })),
);

const boundaries = [
  // Everything (app routes, proxy.ts, …): features only via their barrel.
  { files: [`src/**/${TS}`], rules: restrict(FEATURE_INTERNALS, ICON_LIBS, AXIOS) },

  // Shared layers never depend on features or routes.
  { files: SHARED_LAYERS, rules: restrict(ANY_FEATURE, APP_DIR, ICON_LIBS, AXIOS) },

  // shadcn primitives: lowest layer; they may import lucide-react (shadcn does).
  { files: [`src/components/ui/**/${TS}`], rules: restrict(ANY_FEATURE, APP_DIR, SHARED_FROM_UI, AXIOS) },

  // The icon registry is the one place icon libraries are imported.
  { files: ["src/components/shared/icons.tsx"], rules: restrict(ANY_FEATURE, APP_DIR, AXIOS) },

  // The HTTP layer is the one place axios is imported.
  { files: ["src/lib/axios.ts", `src/lib/api/**/${TS}`], rules: restrict(ANY_FEATURE, APP_DIR, ICON_LIBS) },

  // Features: never another feature, never a relative path out of the folder.
  ...featureBlocks,

  // Env only through T3 Env. `process.env.NODE_ENV` stays allowed: Next.js inlines it everywhere.
  {
    files: [`src/**/${TS}`],
    ignores: ["src/lib/env.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.type='MemberExpression'][object.object.name='process'][object.property.name='env'][property.name!='NODE_ENV']",
          message: "Read env through `env` from @/lib/env (T3 Env), never process.env.",
        },
        {
          selector: "MemberExpression[object.name='process'][property.name='env']:not([parent.type='MemberExpression'])",
          message: "Read env through `env` from @/lib/env (T3 Env), never process.env.",
        },
      ],
    },
  },
];

export default boundaries;
