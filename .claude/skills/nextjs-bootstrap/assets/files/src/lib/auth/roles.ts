/**
 * Role → dashboard route map. This is the single place role routing is defined.
 *
 * Add a role by adding one entry here — `proxy.ts` reads this map and needs
 * no changes. Keep the keys in sync with the roles your backend issues.
 */
export const ROLE_ROUTES = {
  admin: "/admin",
  user: "/user",
} as const;

export type Role = keyof typeof ROLE_ROUTES;

/** Default landing route when a role is unknown or missing. */
export const DEFAULT_ROUTE = "/user";

/** Where to send an unauthenticated visitor. */
export const LOGIN_ROUTE = "/login";

/** Routes anyone may visit without a session. */
export const PUBLIC_ROUTES = [LOGIN_ROUTE, "/register", "/forgot-password"];

/** Resolve the home route for a given role. */
export function routeForRole(role: string | undefined): string {
  if (role && role in ROLE_ROUTES) {
    return ROLE_ROUTES[role as Role];
  }
  return DEFAULT_ROUTE;
}

/** Is this role allowed to be under this path? Used for cross-role protection. */
export function roleOwnsPath(role: string | undefined, pathname: string): boolean {
  const home = routeForRole(role);
  return pathname === home || pathname.startsWith(`${home}/`);
}
