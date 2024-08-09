import mongoose, { Document, Schema } from "mongoose";

export type UserType = Document & {
  name: string;
  wpNumber: string;
  code: string;
  bingoCard: number[];
  active: boolean;
};

const useSchema: Schema = new Schema<UserType>(
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
      unique: true,
    },
    bingoCard: {
      type: [Number],
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model<UserType>("User", useSchema);
