import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, "Not authenticated"));
  try {
    (req as any).user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new ApiError(401, "Invalid token"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if ((req as any).user?.role !== "admin") return next(new ApiError(403, "Forbidden"));
  next();
}
