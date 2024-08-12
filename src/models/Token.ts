import mongoose, { Document, Schema, Types } from "mongoose";

export type TokenType = Document & {
  token: string;
  user: Types.ObjectId;
  createdAt: Date;
};

const tokenSchema: Schema = new Schema(
  {
    token: {
      type: String,
      required: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "UserAdmin",
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      expires: "1h",
    },
  },
);

export const Token = mongoose.model<TokenType>("Token", tokenSchema);
