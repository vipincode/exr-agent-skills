# Auth primitives (JOSE) — utilities only, NOT endpoints

The bootstrap ships JOSE token helpers and auth middleware so that when feature-planner designs the auth feature, module-builder reuses these instead of reinventing them. **This skill does not create login/register/refresh routes.** It installs the primitives and registers them.

## `lib/jwt.ts` — sign & verify

HS256 with a secret from `env` is the default (symmetric, simplest, fine for a single service). Document in ARCHITECTURE.md that switching to RS256/EdDSA means swapping the key import here and nowhere else.

```ts
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "../config/env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface AccessClaims extends JWTPayload {
  sub: string;          // user id
  role: string;         // single role; widen to string[] if RBAC needs it
}

export async function signAccessToken(claims: { sub: string; role: string }) {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_TTL)   // e.g. "15m"
    .sign(secret);
}

export async function signRefreshToken(claims: { sub: string }) {
  return new SignJWT({ typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(env.REFRESH_TOKEN_TTL)  // e.g. "7d"
    .sign(secret);
}

export async function verifyToken<T extends JWTPayload = AccessClaims>(token: string) {
  const { payload } = await jwtVerify<T>(token, secret);
  return payload;
}
```

## `middleware/protect.ts` — auth guard

Reads the bearer token (and, if a feature later opts into cookies, also `req.cookies.access_token`), verifies it, attaches `req.user`. Throws `UnauthorizedError` on any failure. Cookie-vs-bearer is a *feature decision* recorded later in the registry/architecture — the guard supports both sources so the auth feature can choose without editing the guard.

```ts
import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import { UnauthorizedError } from "../lib/app-error";

export async function protect(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = bearer ?? (req as any).cookies?.access_token;
  if (!token) throw new UnauthorizedError("Authentication required");

  const claims = await verifyToken(token);
  req.user = { id: claims.sub as string, role: claims.role as string };
  next();
}
```

## `middleware/require-role.ts` — RBAC gate

```ts
import type { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../lib/app-error";

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError("Insufficient permissions");
    }
    next();
  };
}
```

## Express type augmentation (`types/express.d.ts`)

```ts
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
      id: string;
      log: import("pino").Logger;
    }
  }
}
export {};
```

## Registry entries the bootstrap must write

Seed MODULE_REGISTRY.md with: `signAccessToken`/`signRefreshToken`/`verifyToken` (lib/jwt.ts), `protect` (middleware/protect.ts), `requireRole` (middleware/require-role.ts). State plainly that **auth endpoints do not exist yet** so feature-planner knows to build them and module-builder knows to wire them onto these existing primitives — not to write new token logic.

Env vars to add to the schema and `.env.example`: `JWT_SECRET`, `ACCESS_TOKEN_TTL` (default `15m`), `REFRESH_TOKEN_TTL` (default `7d`).
