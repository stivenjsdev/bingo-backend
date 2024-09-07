import mongoose, { Document, Schema } from "mongoose";

export type UserAdminType = Document & {
  username: string;
  email: string;
  password: string;
  confirmed: boolean;
};

const userAdminSchema: Schema = new Schema<UserAdminType>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    // todo: We need to confirm the user if we dont use token?
    confirmed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const UserAdmin = mongoose.model<UserAdminType>("UserAdmin", userAdminSchema);
