import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { registerBody } from "./auth.schema.js";
import * as ctrl from "./auth.controller.js";

export const authRouter = Router();

// POST /api/auth/register      — public, creates an account and returns { user, token }
authRouter.post("/register", validate({ body: registerBody }), ctrl.register);
