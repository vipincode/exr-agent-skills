import type { UserRole } from "./auth.constants.js";

/** The only user shape that ever leaves the API — never carries passwordHash. */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}
