import { env } from "@/lib/env";

/**
 * Token transport details for the chosen strategy.
 *
 * Default scaffold = strategy (a): backend returns `accessToken` + `refreshToken`
 * in the JSON body, and a Next.js Route Handler sets them as httpOnly cookies.
 * The cookie names come from env so they stay in one place.
 *
 * If you picked a different strategy at scaffold time, this file is where the
 * differences live — see references/auth-bff.md.
 */
export const ACCESS_COOKIE = env.AUTH_ACCESS_COOKIE;
export const REFRESH_COOKIE = env.AUTH_REFRESH_COOKIE;

/** httpOnly cookie options used when WE set the cookies (strategy a). */
export const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Decode a JWT payload WITHOUT verifying the signature.
 *
 * This is intentionally unverified and used ONLY for cheap, non-security
 * decisions in middleware (which role's dashboard to route to). The real
 * security boundary is the backend, which verifies the token on every BFF call.
 * Never trust this for authorization — only for redirect convenience.
 */
export function decodeJwtPayload<T = Record<string, unknown>>(
  token: string | undefined,
): T | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob === "function"
        ? atob(payload)
        : Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Pull a `role` claim out of an access token (unverified — routing only). */
export function getRoleFromToken(token: string | undefined): string | undefined {
  const payload = decodeJwtPayload<{ role?: string }>(token);
  return payload?.role;
}
