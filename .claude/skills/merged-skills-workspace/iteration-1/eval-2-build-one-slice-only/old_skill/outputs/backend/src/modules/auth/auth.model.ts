import { Schema, model, Types } from "mongoose";
import { USER_ROLES, DEFAULT_USER_ROLE, type UserRole } from "./auth.constants.js";

export interface UserDoc {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    // never selected by default — must be asked for explicitly (login only)
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: [...USER_ROLES], required: true, default: DEFAULT_USER_ROLE },
  },
  { timestamps: true }
);

export const User = model<UserDoc>("User", userSchema);
