import { NextResponse, type NextRequest } from "next/server";

import {
  LOGIN_ROUTE,
  PUBLIC_ROUTES,
  ROLE_ROUTES,
  routeForRole,
  roleOwnsPath,
} from "@/lib/auth/roles";
import { ACCESS_COOKIE, getRoleFromToken } from "@/lib/auth/tokens";

/**
 * Role-based routing — the "proxy" that decides where a visitor lands.
 *
 * In Next.js 16+ this file is `proxy.ts` exporting `proxy` (it replaced the
 * deprecated `middleware.ts` / `middleware`). On Next.js ≤ 15 name the file
 * `middleware.ts` and the function `middleware` — the body is identical.
 *
 *   - No session + protected route  → redirect to /login
 *   - Has session + on /login       → redirect to their role's dashboard
 *   - Has session + wrong dashboard  → redirect to their own dashboard
 *
 * Role is read from the (unverified) access-token cookie purely to choose a
 * route. Real authorization happens at the backend on every BFF call, so a
 * forged cookie buys only a redirect. To add a role, edit `lib/auth/roles.ts` —
 * this file needs no change.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const role = getRoleFromToken(accessToken);
  const isAuthed = Boolean(accessToken);
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // Unauthenticated visitor hitting a protected route → login.
  if (!isAuthed && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_ROUTE;
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated visitor on a public-only page (e.g. /login) → their dashboard.
  if (isAuthed && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = routeForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Authenticated visitor under another role's dashboard root → their own.
  if (isAuthed) {
    const inSomeRoleArea = Object.values(ROLE_ROUTES).some(
      (home) => pathname === home || pathname.startsWith(`${home}/`),
    );
    if (inSomeRoleArea && !roleOwnsPath(role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = routeForRole(role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

/**
 * Run on everything except Next internals, the BFF API routes, and static files.
 * (The BFF under /api manages its own auth; we don't redirect API calls.)
 */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
