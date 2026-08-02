import { api } from "@/lib/axios";
import { logoutEnvelopeSchema } from "../schema/auth.schema";

/**
 * POST /api/auth/logout.
 *
 * CONTRACT NOTE: the frontend plan records `data: null`, but the backend plan/route returns
 * **204 No Content with an empty body**, so there is nothing to unwrap on the happy path.
 * Both shapes are accepted; anything else still fails loudly through the schema.
 */
export async function logout(): Promise<void> {
  const res = await api.post("/auth/logout");
  if (res.status === 204 || !res.data) return;
  logoutEnvelopeSchema.parse(res.data);
}
