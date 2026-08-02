import { api } from "@/lib/axios";
import {
  registerEnvelopeSchema,
  type RegisterData,
  type RegisterRequest,
} from "../schema/register.schema";

/**
 * POST /api/auth/register → BFF catch-all → backend.
 * Unwraps the success envelope and parses `data`, so a drifted payload throws
 * instead of rendering garbage.
 */
export async function register(payload: RegisterRequest): Promise<RegisterData> {
  const res = await api.post("/auth/register", payload);
  return registerEnvelopeSchema.parse(res.data).data;
}
