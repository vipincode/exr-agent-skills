import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";
import { UnauthorizedError } from "../lib/app-error.js";

// Auth guard. Reads a bearer token, and — if a feature later opts into cookies
// (by mounting a cookie parser) — also `req.cookies.access_token`. Cookie-vs-bearer
// is a feature decision; the guard supports both so the auth feature can choose
// without editing it. Any verification failure (expired, bad signature) → 401.
export async function protect(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = bearer ?? req.cookies?.access_token;
  if (!token) throw new UnauthorizedError("Authentication required");

  const claims = await verifyToken(token).catch(() => {
    throw new UnauthorizedError("Invalid or expired token");
  });
  req.user = { id: claims.sub, role: claims.role };
  next();
}

/**
 * The authenticated user on a route guarded by `protect`. Use this in
 * controllers instead of `req.user!` — it narrows the type and fails with a
 * clean 401 (not a TypeError) if the route was wired without `protect`.
 */
export function getAuthUser(req: Pick<Request, "user">): { id: string; role: string } {
  if (!req.user) throw new UnauthorizedError("Authentication required");
  return req.user;
}
