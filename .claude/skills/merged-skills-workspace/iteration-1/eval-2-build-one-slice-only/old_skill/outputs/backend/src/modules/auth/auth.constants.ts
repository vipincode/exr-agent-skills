export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_USER_ROLE: UserRole = "user";

/** bcrypt work factor — see _docs/FEATURE_PLAN_auth.md "Decisions". */
export const BCRYPT_COST = 10;

/**
 * A real bcrypt hash of a random string. Login compares against this when the email is
 * unknown, so an unknown account costs the same time as a wrong password and the endpoint
 * doesn't leak which emails exist.
 */
export const DUMMY_PASSWORD_HASH =
  "$2b$10$C6UzMDM.H6dfI/f/IKcEe.9Z1n1Y2s6E3JQ4M0GgW2xU5tK1r0N9K";

/** One message for both "unknown email" and "wrong password" (see plan: Errors & edge cases). */
export const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

export const EMAIL_TAKEN_MESSAGE = "An account with that email already exists";
