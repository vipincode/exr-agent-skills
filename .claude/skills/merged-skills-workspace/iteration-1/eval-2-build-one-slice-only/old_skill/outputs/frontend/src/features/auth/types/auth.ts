import type * as z from "zod";
import type {
  authSessionSchema,
  authUserSchema,
  loginRequestSchema,
  registerRequestSchema,
} from "../schema/auth.schema";

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type RegisterInput = z.infer<typeof registerRequestSchema>;
export type LoginInput = z.infer<typeof loginRequestSchema>;
