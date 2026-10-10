import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import globals from "globals";

// ---------------------------------------------------------------------------
// Architecture boundaries, enforced by lint so they hold no matter who (or
// which AI) writes the code. Each rule below mirrors an invariant in
// ARCHITECTURE.md; change both together.
// ---------------------------------------------------------------------------

// Another module may be imported only through its public index.ts.
// `../product/product.model.js` is blocked; `../product/index.js` is allowed.
const crossModuleInternals = {
  regex: "^\\.\\./[^/]+/(?!index\\.js$)[^/]+$",
  message:
    "Import another module only through its public index.js (and only its service surface). See ARCHITECTURE.md → Module boundaries.",
};

// Only <name>.repository.ts may touch the Mongoose model at runtime. Type-only
// imports (`import type { ProductDoc }`) stay allowed — the mapper needs them.
const modelOutsideRepository = {
  regex: "\\.model\\.js$",
  allowTypeImports: true,
  message:
    "Only <name>.repository.ts may import the model. Go through the repository (from the service).",
};

// Controllers and routes talk to the service, never to data access directly.
const repositoryFromHttpLayer = {
  regex: "\\.repository\\.js$",
  message: "Controllers/routes call the service, never the repository.",
};

// Shared layers sit below modules and must never depend on one.
const moduleFromSharedLayer = {
  regex: "(^|/)modules/",
  message:
    "lib/, middleware/, config/, types/ and constants/ must not import from modules/. Move the shared piece down instead.",
};

// typescript-eslint's variant of the core rule, for `allowTypeImports`.
const RULE = "@typescript-eslint/no-restricted-imports";
const restrict = (...patterns) => ["error", { patterns }];

export default defineConfig(
  { ignores: ["dist/", "node_modules/", "coverage/"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "no-console": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // --- Boundaries (ordered general → specific; a later block replaces the
  // rule's options for the files it matches, so each lists its full set) ---
  {
    files: ["src/lib/**/*.ts", "src/middleware/**/*.ts", "src/config/**/*.ts", "src/types/**/*.ts", "src/constants/**/*.ts"],
    rules: { [RULE]: restrict(moduleFromSharedLayer) },
  },
  {
    files: ["src/modules/**/*.ts"],
    rules: { [RULE]: restrict(crossModuleInternals, modelOutsideRepository) },
  },
  {
    files: ["src/modules/**/*.controller.ts", "src/modules/**/*.routes.ts"],
    rules: {
      [RULE]: restrict(crossModuleInternals, modelOutsideRepository, repositoryFromHttpLayer),
    },
  },
  {
    // The repository owns the model; tests may seed through it.
    files: ["src/modules/**/*.repository.ts", "src/modules/**/__tests__/**/*.ts"],
    rules: { [RULE]: restrict(crossModuleInternals) },
  },

  // --- Exceptions ---
  {
    // Fails before the logger exists, so it is the one allowed console user.
    files: ["src/config/env.ts"],
    rules: { "no-console": "off" },
  },
  {
    files: ["src/**/__tests__/**/*.ts", "test/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
);
