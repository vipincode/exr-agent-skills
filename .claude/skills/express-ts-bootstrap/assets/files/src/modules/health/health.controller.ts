import type { Request, Response } from "express";
import { ok } from "../../lib/http.js";
import { getHealth } from "./health.service.js";

// Thin HTTP layer: no try/catch, responds only through the shared envelope.
export async function check(_req: Request, res: Response) {
  ok(res, getHealth());
}
