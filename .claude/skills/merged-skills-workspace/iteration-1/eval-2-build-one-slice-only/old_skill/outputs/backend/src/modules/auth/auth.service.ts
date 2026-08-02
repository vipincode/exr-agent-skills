import { ConflictError, UnauthorizedError } from "../../lib/app-error.js";
import { signAccessToken } from "../../lib/jwt.js";
import { User, type UserDoc } from "./auth.model.js";
import {
  DUMMY_PASSWORD_HASH,
  EMAIL_TAKEN_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  type UserRole,
} from "./auth.constants.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import { hashPassword, isDuplicateKeyError, verifyPassword } from "./auth.utils.js";

export interface AuthUserDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResult {
  user: AuthUserDTO;
  token: string;
}

/** passwordHash is deliberately absent — it must never reach a response. */
const toDTO = (u: UserDoc): AuthUserDTO => ({
  id: u._id.toString(),
  email: u.email,
  name: u.name,
  role: u.role,
});

async function issue(user: UserDoc): Promise<AuthResult> {
  const token = await signAccessToken({ sub: user._id.toString(), role: user.role });
  return { user: toDTO(user), token };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existing = await User.exists({ email: input.email });
  if (existing) throw new ConflictError(EMAIL_TAKEN_MESSAGE);

  const passwordHash = await hashPassword(input.password);

  // The unique index is the real guard for two concurrent submits of the same email.
  const user = await User.create({
    email: input.email,
    name: input.name,
    passwordHash,
  }).catch((err: unknown) => {
    if (isDuplicateKeyError(err)) throw new ConflictError(EMAIL_TAKEN_MESSAGE);
    throw err;
  });

  return issue(user);
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select("+passwordHash");

  // Always compare a hash, even when the account doesn't exist, so response timing and the
  // error itself are identical for "unknown email" and "wrong password".
  const matches = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!user || !matches) throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);

  return issue(user);
}
