import { SignJWT } from "jose";

/**
 * Access-token signing (JOSE, per ARCHITECTURE.md).
 *
 * NOTE: verification already lives in `src/middleware/auth.ts` (`protect`). If that middleware
 * already imports a token helper, import ITS signer here instead of this file — do not keep two.
 */

export interface AccessTokenPayload {
  /** user id */
  sub: string;
  role: string;
}

/** Long-lived access token — refresh rotation is out of scope (see the auth feature plan). */
export const ACCESS_TOKEN_TTL = "30d";

function getSigningKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getSigningKey());
}
