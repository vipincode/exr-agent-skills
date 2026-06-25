import * as z from "zod";
import mongoose from "mongoose";
import {
  AppError,
  BadRequestError,
  ConflictError,
  UnprocessableError,
} from "./app-error.js";

/**
 * Map a Mongoose or Zod error to an AppError so the central error handler can
 * render it through the standard envelope. Returns `null` for anything it
 * doesn't recognize, letting the caller fall back to generic 500 handling.
 *
 * This is the single source of truth for these mappings — modules must NOT
 * re-implement `instanceof CastError` / `code === 11000` checks of their own.
 */
export function normalizeDbError(err: unknown): AppError | null {
  // A raw Zod error that reached the handler (i.e. not caught by the validate
  // middleware up front — e.g. response/parse validation deeper in a service).
  if (err instanceof z.ZodError) {
    return new BadRequestError("Validation failed", z.treeifyError(err));
  }

  // Malformed value for a typed path (e.g. an invalid ObjectId in req.params).
  if (err instanceof mongoose.Error.CastError) {
    return new BadRequestError(`Invalid value for "${err.path}"`, {
      path: err.path,
      value: err.value,
    });
  }

  // Schema validation failure on a document save/update.
  if (err instanceof mongoose.Error.ValidationError) {
    const details: Record<string, string> = {};
    for (const [path, fieldError] of Object.entries(err.errors)) {
      details[path] = fieldError.message;
    }
    return new UnprocessableError("Validation failed", details);
  }

  // Duplicate key (unique index violation). Driver error, not a Mongoose.Error
  // subclass, so detect it by shape rather than instanceof.
  if (isDuplicateKeyError(err)) {
    return new ConflictError("Resource already exists", {
      keyValue: err.keyValue,
    });
  }

  return null;
}

interface DuplicateKeyError {
  code: number;
  keyValue?: Record<string, unknown>;
}

function isDuplicateKeyError(err: unknown): err is DuplicateKeyError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === 11000
  );
}
