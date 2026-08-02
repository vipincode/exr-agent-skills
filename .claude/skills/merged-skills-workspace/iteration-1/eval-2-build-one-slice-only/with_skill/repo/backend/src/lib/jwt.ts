import { SignJWT } from "jose";

const ALG = "HS256";
const ACCESS_TOKEN_TTL = "7d";

export interface AccessTokenPayload {
  /** user id */
  sub: string;
  role: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/** Signs a bearer access token. Verification lives in the `protect` middleware. */
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getSecret());
}
