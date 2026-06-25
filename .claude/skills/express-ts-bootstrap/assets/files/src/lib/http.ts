import type { Response } from "express";

// The single success envelope. Controllers call these — they never hand-roll a
// response shape. The matching error envelope lives only in error-handler.ts.
export function ok<T>(res: Response, data: T, meta?: unknown): void {
  res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created<T>(res: Response, data: T): void {
  res.status(201).json({ success: true, data });
}

export function noContent(res: Response): void {
  res.status(204).send();
}
