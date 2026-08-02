/** Query-key root for this feature — every auth key is namespaced under it. */
export const AUTH_QUERY_KEY = ["auth"] as const;

/** Shown at form level when the API rejects the credentials (same copy for both 401 causes). */
export const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

/** Shown inline on the email field when register returns 409. */
export const EMAIL_TAKEN_MESSAGE = "An account with that email already exists";
