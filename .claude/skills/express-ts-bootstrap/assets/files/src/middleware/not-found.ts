import type { RequestHandler } from "express";
import { NotFoundError } from "../lib/app-error.js";

// Terminal 404. Mounted after all routes; Express 5 forwards the throw to the
// error handler, which renders it through the standard envelope.
export const notFound: RequestHandler = (req) => {
  throw new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`);
};
