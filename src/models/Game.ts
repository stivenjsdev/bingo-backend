import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "./User";
import type { UserAdminType } from "./UserAdmin";

export type GameType = Document & {
  gameName: string;
  date: Date;
  players: UserType[];
  winner: string;
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    winner: {
      type: String,
      trim: true,
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
