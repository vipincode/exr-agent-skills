import { Schema, model, Types } from "mongoose";
import { USER_ROLES, DEFAULT_USER_ROLE, type UserRole } from "./auth.constants.js";

export interface UserDoc {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string; // never selected by default
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    name:         { type: String, required: true, trim: true },
    role:         { type: String, required: true, enum: USER_ROLES, default: DEFAULT_USER_ROLE },
  },
  { timestamps: true }
);

export const User = model<UserDoc>("User", userSchema);
