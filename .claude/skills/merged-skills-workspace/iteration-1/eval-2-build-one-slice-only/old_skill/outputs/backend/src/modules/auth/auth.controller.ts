import type { Request, Response } from "express";
import { ok, created, noContent } from "../../lib/app-response.js";
import * as svc from "./auth.service.js";

export async function register(req: Request, res: Response) {
  const result = await svc.registerUser(req.body);
  return created(res, result, "Account created");
}

export async function login(req: Request, res: Response) {
  const result = await svc.loginUser(req.body);
  return ok(res, result, "Signed in");
}

/**
 * Tokens are stateless bearer tokens (no refresh rotation, no server-side session store in
 * scope), so logout is a client-side discard. `protect` still runs, so calling it without a
 * valid token is a 401 as the plan specifies.
 */
export async function logout(_req: Request, res: Response) {
  return noContent(res);
}
