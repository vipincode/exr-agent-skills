import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";
import { UnauthorizedError } from "../lib/app-error.js";

// Auth guard. Reads a bearer token, and — if a feature later opts into cookies —
// also `req.cookies.access_token`. Cookie-vs-bearer is a feature decision; the
// guard supports both sources so the auth feature can choose without editing it.
export async function protect(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = bearer ?? (req as any).cookies?.access_token;
  if (!token) throw new UnauthorizedError("Authentication required");

  const claims = await verifyToken(token);
  req.user = { id: claims.sub, role: claims.role };
  next();
}
