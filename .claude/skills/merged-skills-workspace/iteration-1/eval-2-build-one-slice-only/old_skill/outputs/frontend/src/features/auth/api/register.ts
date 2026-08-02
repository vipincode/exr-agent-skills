import { api } from "@/lib/axios";
import { authSessionEnvelopeSchema } from "../schema/auth.schema";
import type { AuthSession, RegisterInput } from "../types/auth";

/** POST /api/auth/register -> BFF catch-all -> backend. Unwraps + validates the envelope. */
export async function register(input: RegisterInput): Promise<AuthSession> {
  const res = await api.post("/auth/register", input);
  return authSessionEnvelopeSchema.parse(res.data).data;
}
