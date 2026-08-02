import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

// Central handler. Note the response shape: { data, message } — no `success` flag.
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof ApiError ? err.status : 500;
  res.status(status).json({ data: null, message: err.message || "Server error" });
}
