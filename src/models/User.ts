import mongoose, { Document, Schema } from "mongoose";

export type UserType = Document & {
  name: string;
  wpNumber: string;
  code: string;
  bingoCard: number[][];
  game: Schema.Types.ObjectId;
  active: boolean;
};

const userSchema: Schema = new Schema<UserType>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    wpNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      maxlength: 8,
      unique: true,
    },
    bingoCard: {
      type: [[Number]],
      required: true,
    },
    game: {
      type: Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<UserType>("User", userSchema);
