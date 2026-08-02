export const USER_ROLES = ["user", "admin"] as const;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_NAME_LENGTH = 80;

/** Query-key root for this feature. */
export const AUTH_QUERY_KEYS = {
  all: ["auth"] as const,
  session: ["auth", "session"] as const,
};

/** Where a successful register/login lands. */
export const POST_AUTH_REDIRECT = "/";
