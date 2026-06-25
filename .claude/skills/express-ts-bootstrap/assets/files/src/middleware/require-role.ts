import type { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../lib/app-error.js";

// Role gate. Use after `protect`, which populates req.user.
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError("Insufficient permissions");
    }
    next();
  };
}
