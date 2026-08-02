export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const DEFAULT_USER_ROLE: UserRole = "user";

/** bcrypt work factor (module plan: cost 10). */
export const BCRYPT_COST = 10;

export const MAX_NAME_LENGTH = 80;
export const MIN_PASSWORD_LENGTH = 8;
