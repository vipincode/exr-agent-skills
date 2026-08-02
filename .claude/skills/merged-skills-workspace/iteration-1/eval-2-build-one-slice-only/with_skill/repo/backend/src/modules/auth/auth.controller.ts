import type { Request, Response } from "express";
import { created } from "../../lib/app-response.js";
import * as svc from "./auth.service.js";

export async function register(req: Request, res: Response) {
  const result = await svc.registerUser(req.body);   // { user, token }
  return created(res, result, "Registered");
}
