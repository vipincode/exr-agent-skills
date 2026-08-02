import bcrypt from "bcrypt";
import { ConflictError } from "../../lib/app-error.js";
import { signAccessToken } from "../../lib/jwt.js";
import { User, type UserDoc } from "./auth.model.js";
import { BCRYPT_COST } from "./auth.constants.js";
import type { RegisterInput } from "./auth.schema.js";
import type { AuthResult, PublicUser } from "./auth.types.js";

const toPublicUser = (u: UserDoc): PublicUser => ({
  id: u._id.toString(),
  email: u.email,
  name: u.name,
  role: u.role,
});

/** Mongo duplicate-key error — the unique index on email is what makes concurrent signups safe. */
const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;

/** Signs an access token for a user. Slice 02 (login) reuses this instead of re-implementing it. */
async function issueToken(user: PublicUser): Promise<string> {
  return signAccessToken({ sub: user.id, role: user.role });
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  let doc: UserDoc;
  try {
    doc = await User.create({ email: input.email, name: input.name, passwordHash });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ConflictError("Email already registered");
    throw err;
  }

  const user = toPublicUser(doc);
  return { user, token: await issueToken(user) };
}
