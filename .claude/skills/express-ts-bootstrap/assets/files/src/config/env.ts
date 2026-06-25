import * as z from "zod";

// Single source of truth for environment configuration. Parsed once at startup;
// the process exits on failure so the app never boots half-configured.
// Nothing else in the codebase reads process.env directly — import `env`.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Logger isn't available yet (it depends on env), so this is the one allowed
  // console use: fail fast and loud before anything else starts.
  console.error(
    "Invalid environment variables:",
    JSON.stringify(z.treeifyError(parsed.error), null, 2),
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
