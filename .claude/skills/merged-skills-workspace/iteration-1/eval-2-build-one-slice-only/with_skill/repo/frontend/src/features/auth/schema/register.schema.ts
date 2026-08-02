import * as z from "zod";
import { MAX_NAME_LENGTH, MIN_PASSWORD_LENGTH, USER_ROLES } from "../constants/auth";

/** Mirrors the backend's registerBody — the slice's request shape, declared once. */
export const registerRequestSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  name: z.string().trim().min(1, "Name is required").max(MAX_NAME_LENGTH),
});

/** The public user the API returns. Slice 02 (login) returns the same shape. */
export const authUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  role: z.enum(USER_ROLES),
});

export const registerDataSchema = z.object({
  user: authUserSchema,
  token: z.string().min(1),
});

/** Success envelope from ARCHITECTURE.md — parsed so contract drift fails loudly. */
export const registerEnvelopeSchema = z.object({
  success: z.literal(true),
  data: registerDataSchema,
  message: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type RegisterData = z.infer<typeof registerDataSchema>;
