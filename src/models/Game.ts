import mongoose, { Document, Schema } from "mongoose";
import { BingoCard } from "./BingoCard";
import type { UserType } from "./User";
import type { UserAdminType } from "./UserAdmin";
import { WinningStrategy } from "./WinningStrategy";

export type GameType = Document & {
  strategy?: WinningStrategy;
  gameName: string;
  gameType: number;
  date: Date;
  players: UserType[];
  winner?: UserType;
  balls: number[];
  drawnBalls: number[];
  userAdmin: Schema.Types.ObjectId | UserAdminType;
  active: boolean;
  checkWin(card: BingoCard): boolean;
  drawBall(): number | null;
  resetGame(): void;
  removePlayer(playerId: string): void;
  setStrategy(strategy: WinningStrategy): void;
};

const GameSchema: Schema = new Schema<GameType>(
  {
    strategy: {
      type: Object, // Nombre de la estrategia actual
    },
    gameName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    gameType: {
      type: Number,
      enum: [0, 1, 2, 3], // 0: FullCard, 1: Diagonal, 2: Corners, 3: Frame
      default: 0,
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
    balls: {
      type: [Number],
      required: true, // todo: maybe remove this
      default: Array.from({ length: 75 }, (_, i) => i + 1),
    },
    drawnBalls: {
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
  {
    timestamps: true,
    methods: {
      // Método para sacar una balota y agregarla a drawnBalls
      drawBall(): number | null {
        if (!this.active) {
          console.log("El juego está inactivo.");
          return null;
        }
        if (this.balls.length === 0) {
          console.log("No quedan más balotas.");
          return null;
        }

        // Sacar una balota aleatoria
        const randomIndex = Math.floor(Math.random() * this.balls.length);
        const drawnBall = this.balls.splice(randomIndex, 1)[0];

        // Agregar la balota a drawnBalls
        this.drawnBalls.push(drawnBall);

        console.log(`Balota sacada: ${drawnBall}`);
        return drawnBall;
      },

      // Método para cambiar la estrategia
      setStrategy(strategy: WinningStrategy): void {
        this.strategy = strategy;
      },

      // Método para verificar si el cartón es ganador según la estrategia actual
      checkWin(card: BingoCard): boolean {
        return this.strategy.checkWin(card, new Set(this.drawnBalls));
      },

      // Método para reiniciar el juego
      resetGame(): void {
        this.winner = undefined;
        this.drawnBalls = [];
        this.balls = Array.from({ length: 75 }, (_, i) => i + 1);
        this.active = true;
      },

      // Método para remover un jugador del juego
      removePlayer(playerId: string): void {
        this.players = this.players.filter(
          (player) => player._id.toString() !== playerId
        );
      },
    },
  }
);

export const Game = mongoose.model<GameType>("Game", GameSchema);
