import "server-only";
import { cookies } from "next/headers";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  cookieOptions,
  getRoleFromToken,
} from "@/lib/auth/tokens";

/**
 * Server-side session helpers. Use from Route Handlers and Server Components.
 * (The role-routing proxy reads cookies off the request directly — see proxy.ts —
 * because it runs before `next/headers` is available.)
 *
 * In Next.js, `cookies()` is async, so these are async too.
 */

export interface Session {
  accessToken: string;
  role?: string;
}

/** Read the current session from the httpOnly access cookie, if any. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;
  return { accessToken, role: getRoleFromToken(accessToken) };
}

/**
 * Set the auth cookies (strategy a: we own them). Pass the tokens the backend
 * returned in its login response body.
 */
export async function setSession(tokens: {
  accessToken: string;
  refreshToken?: string;
}): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions);
  if (tokens.refreshToken) {
    store.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions);
  }
}

/** Clear the auth cookies (logout). */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
