import { api } from "@/lib/axios";
import { authSessionEnvelopeSchema } from "../schema/auth.schema";
import type { AuthSession, LoginInput } from "../types/auth";

/** POST /api/auth/login -> BFF catch-all -> backend. Unwraps + validates the envelope. */
export async function login(input: LoginInput): Promise<AuthSession> {
  const res = await api.post("/auth/login", input);
  return authSessionEnvelopeSchema.parse(res.data).data;
}
