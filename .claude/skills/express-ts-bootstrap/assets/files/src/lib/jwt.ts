import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "../config/env.js";

// HS256 with a symmetric secret — simplest, fine for a single service. To move
// to RS256/EdDSA, swap the key import here and nowhere else.
const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface AccessClaims extends JWTPayload {
  sub: string; // user id
  role: string; // single role; widen to string[] if RBAC needs it
}

export async function signAccessToken(claims: { sub: string; role: string }) {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_TTL)
    .sign(secret);
}

export async function signRefreshToken(claims: { sub: string }) {
  return new SignJWT({ typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(env.REFRESH_TOKEN_TTL)
    .sign(secret);
}

export async function verifyToken<T extends JWTPayload = AccessClaims>(
  token: string,
): Promise<T> {
  const { payload } = await jwtVerify<T>(token, secret);
  return payload;
}
