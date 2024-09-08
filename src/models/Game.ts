import mongoose, { Document, Schema } from "mongoose";
import type { UserType } from "./User";
import type { UserAdminType } from "./UserAdmin";

export type GameType = Document & {
  gameName: string;
  date: Date;
  players: UserType[];
  winner?: UserType;
  unsortedNumbers: number[];
  chosenNumbers: number[];
  userAdmin: Schema.Types.ObjectId | UserAdminType;
  active: boolean;
};

const GameSchema: Schema = new Schema<GameType>(
  {
    gameName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    date: {
      type: Date,
      required: true,
    },
    players: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    winner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    unsortedNumbers: {
      type: [Number],
      required: true,
    },
    chosenNumbers: {
      type: [Number],
      default: [],
    },
    userAdmin: {
      type: Schema.Types.ObjectId,
      ref: "UserAdmin",
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Game = mongoose.model<GameType>("Game", GameSchema);
