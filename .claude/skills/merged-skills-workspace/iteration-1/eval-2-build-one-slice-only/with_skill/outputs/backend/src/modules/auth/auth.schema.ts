import * as z from "zod";
import { MAX_NAME_LENGTH, MIN_PASSWORD_LENGTH } from "./auth.constants.js";

export const registerBody = z.object({
  email:    z.email().trim().toLowerCase(),
  password: z.string().min(MIN_PASSWORD_LENGTH),
  name:     z.string().trim().min(1).max(MAX_NAME_LENGTH),
});

export type RegisterInput = z.infer<typeof registerBody>;
