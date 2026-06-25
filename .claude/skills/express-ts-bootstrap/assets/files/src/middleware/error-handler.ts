import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../lib/app-error.js";
import { normalizeDbError } from "../lib/db-errors.js";

// The ONLY place that renders an error envelope. Express 5 forwards both sync
// throws and async rejections here, so controllers never try/catch.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // AppError as-is; otherwise try to normalize known Mongoose/Zod errors.
  const normalized = err instanceof AppError ? err : normalizeDbError(err);

  if (normalized) {
    if (normalized.statusCode >= 500) {
      req.log?.error({ err: normalized }, normalized.message);
    } else {
      req.log?.warn({ code: normalized.code }, normalized.message);
    }
    res.status(normalized.statusCode).json({
      success: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        ...(normalized.details ? { details: normalized.details } : {}),
      },
    });
    return;
  }

  // Unknown / non-operational error: log it, return a generic 500, and never
  // leak the message or stack in production.
  req.log?.error({ err }, "Unhandled error");
  const message =
    env.NODE_ENV === "production"
      ? "Internal server error"
      : String((err as Error)?.message ?? err);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL", message },
  });
};
