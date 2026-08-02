import bcrypt from "bcrypt";
import { BCRYPT_COST } from "./auth.constants.js";

/** Module-local helpers — used only by auth.service.ts, so they stay in the module. */

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, BCRYPT_COST);

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

/** MongoServerError 11000 — a unique index rejected the write (concurrent register). */
export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}
