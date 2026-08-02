import * as z from "zod";

/**
 * Mirrors the observed contract in `_docs/FEATURE_PLAN_auth.md`:
 *   POST /auth/register -> { success, data: { user, token }, message }
 *   POST /auth/login    -> { success, data: { user, token }, message }
 *   POST /auth/logout   -> 204 (no body)
 */

export const authUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  role: z.enum(["user", "admin"]),
});

export const authSessionSchema = z.object({
  user: authUserSchema,
  token: z.string(),
});

/** Envelope wrappers — drift in the envelope fails loudly instead of rendering garbage. */
export const authSessionEnvelopeSchema = z.object({
  success: z.literal(true),
  data: authSessionSchema,
  message: z.string().optional(),
});

export const logoutEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.null(),
  message: z.string().optional(),
});

/** Request / form payloads. Validation rules match the backend's registerSchema/loginSchema. */
export const registerRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1, "Name is required").max(80),
});

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});
