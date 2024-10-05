import mongoose, { Document, Schema } from "mongoose";
import { BingoCardBuilder } from "../builders/BingoCardBuilder";
import { BingoCard } from "./BingoCard";

class UserFactory {
  // Método para generar el código de usuario
  generateUserCode(name: string): string {
    const namePart = this.getNamePart(name);
    const randomPart = this.getRandomNumberPart();
    return `${namePart}${randomPart}`;
  }

  // Obtener las primeras 3 letras del nombre en minúsculas
  private getNamePart(name: string): string {
    return name.slice(0, 3).toLowerCase();
  }

  // Generar los 5 números aleatorios
  private getRandomNumberPart(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }
}

export type UserType = Document & {
  name: string;
  wpNumber: string;
  code: string;
  bingoCard: Object;
  game: Schema.Types.ObjectId;
  active: boolean;
  online: boolean;
  socketId: string | null;
  setCode(): void;
  getBingoCard(): BingoCard;
  setBingoCard(bingoCard: BingoCard): void;
  changeBingoCard(): void;
  setOnline(socketId: string): void;
  setOffline(): void;
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
    },
    code: {
      type: String,
      trim: true,
      minlength: 8,
      maxlength: 8,
      unique: true,
    },
    bingoCard: {
      type: Object,
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
    online: {
      type: Boolean,
      default: false,
    },
    socketId: {
      type: String,
    },
  },
  {
    timestamps: true,
    methods: {
      setCode() {
        const userFactory = new UserFactory();
        this.code = userFactory.generateUserCode(this.name);
      },
      getBingoCard(): BingoCard {
        const cardObject = this.bingoCard;
        const cardMap = new Map<string, number[]>(Object.entries(cardObject)); // Convertir objeto a Map
        return new BingoCard(cardMap);
      },
      setBingoCard(bingoCard: BingoCard): void {
        this.bingoCard = Object.fromEntries(bingoCard.getCard()); // Convertir Map a objeto
      },
      changeBingoCard(): void {
        const builder = new BingoCardBuilder();
        const bingoCard = builder
          .buildColumnB()
          .buildColumnI()
          .buildColumnN()
          .buildColumnG()
          .buildColumnO()
          .getBingoCard();
        this.setBingoCard(bingoCard);
      },
      setOnline(socketId: string): void {
        this.online = true;
        this.socketId = socketId;
      },
      setOffline(): void {
        this.online = false;
        this.socketId = undefined;
      },
    },
  }
);

userSchema.pre("save", function (next) {
  const user = this as unknown as UserType;

  // Si no tiene código, generar uno
  if (!user.code) {
    user.setCode();
  }

  // Si no tiene cartón de bingo, crear uno
  if (!user.bingoCard) {
    user.changeBingoCard();
  }

  next();
});

// Player schema
export const User = mongoose.model<UserType>("User", userSchema);
