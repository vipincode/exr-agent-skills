import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import * as ctrl from "./auth.controller.js";

export const authRouter = Router();

// POST /api/auth/register — public, creates an account and returns user + token
authRouter.post("/register", validate({ body: registerSchema }), ctrl.register);

// POST /api/auth/login    — public, returns user + token
authRouter.post("/login", validate({ body: loginSchema }), ctrl.login);

// POST /api/auth/logout   — requires a valid bearer token, 204
authRouter.post("/logout", protect, ctrl.logout);
