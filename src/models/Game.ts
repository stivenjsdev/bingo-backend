import mongoose, { Document, Schema } from "mongoose";

export type GameType = Document & {
  gameName: string;
  date: Date;
  players: string[];
  winner: string;
  numbersDrawn: number[];
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
    required: true,
  },
  winner: {
    type: String,
    trim: true,
  },
  numbersDrawn: {
    type: [Number],
    required: true,
  },
});

const Game = mongoose.model<GameType>("Game", GameSchema);

export default Game;
