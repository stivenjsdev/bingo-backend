import mongoose, { Document, Schema } from "mongoose";
import type { UserAdminType } from "./UserAdmin";

export type GameType = Document & {
  gameName: string;
  date: Date;
  players: string[];
  winner: string;
  unsortedNumbers: number[];
  drawnNumbers: number[];
  userAdmin: Schema.Types.ObjectId | UserAdminType;
  active: boolean;
}

const GameSchema: Schema = new Schema<GameType>({
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
  players: {
    type: [String],
    default: [],
  },
  winner: {
    type: String,
    trim: true,
  },
  unsortedNumbers: {
    type: [Number],
    required: true,
  },
  drawnNumbers: {
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
}, { timestamps: true });

export const Game = mongoose.model<GameType>("Game", GameSchema);
