import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

/**
 * Single, validated view of the environment, built with **T3 Env**
 * (https://env.t3.gg). Parsed once at module load. Components never read
 * `process.env` directly — import `env` from here.
 *
 * T3 Env enforces the server/client split for you:
 *  - `server` vars (secrets, no `NEXT_PUBLIC_` prefix) are readable only in
 *    server contexts; touching one from client code throws, so they can never
 *    leak into the browser bundle.
 *  - `client` vars MUST be prefixed `NEXT_PUBLIC_` and listed in
 *    `experimental__runtimeEnv`, because Next.js inlines those at build time.
 *
 * This is the ONLY place env is defined. Add new variables here (and to
 * `.env.example`), never as ad-hoc `process.env` reads elsewhere.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    BACKEND_URL: z.url(),
    AUTH_ACCESS_COOKIE: z.string().min(1).default("access_token"),
    AUTH_REFRESH_COOKIE: z.string().min(1).default("refresh_token"),
  },
  client: {
    // Browser-exposed values. Must be `NEXT_PUBLIC_`-prefixed and mirrored in
    // `experimental__runtimeEnv` below. Example:
    // NEXT_PUBLIC_APP_NAME: z.string().min(1),
  },
  /**
   * Next.js inlines `NEXT_PUBLIC_*` at build time, so client (and shared) vars
   * must be destructured here explicitly. Server vars are read from
   * `process.env` automatically and do not need to be repeated.
   */
  experimental__runtimeEnv: {
    // NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
  /** Treat empty strings as undefined so a blank var fails validation instead of passing. */
  emptyStringAsUndefined: true,
});
