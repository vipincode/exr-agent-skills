import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger.js";

// Attaches a stable request id and a child logger (`req.log`) to every request.
// Application code inside a request logs through `req.log`, never the root logger.
export const requestContext: RequestHandler = (req, res, next) => {
  const headerId = req.headers["x-request-id"];
  const id = (Array.isArray(headerId) ? headerId[0] : headerId) || randomUUID();
  req.id = id;
  req.log = logger.child({ reqId: id });
  res.setHeader("x-request-id", id);
  next();
};
