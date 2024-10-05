import { BingoCard } from "../models/BingoCard";

interface IBingoCardBuilder {
  buildColumnB(): this;
  buildColumnI(): this;
  buildColumnN(): this;
  buildColumnG(): this;
  buildColumnO(): this;
  reset(): void;
  getBingoCard(): BingoCard;
}

export class BingoCardBuilder implements IBingoCardBuilder {
  private bingoCard: BingoCard;

  constructor() {
    this.reset();
  }

  // El método reset inicializa el producto para crear un nuevo cartón
  reset(): void {
    this.bingoCard = new BingoCard();
  }

  private generateUniqueNumbers(
    min: number,
    max: number,
    count: number
  ): number[] {
    const numbers: number[] = [];
    while (numbers.length < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers;
  }

  buildColumnB(): this {
    const numbers = this.generateUniqueNumbers(1, 15, 5);
    this.bingoCard.addColumn("B", numbers);
    return this;
  }

  buildColumnI(): this {
    const numbers = this.generateUniqueNumbers(16, 30, 5);
    this.bingoCard.addColumn("I", numbers);
    return this;
  }

  buildColumnN(): this {
    const numbers = this.generateUniqueNumbers(31, 45, 4);
    numbers.splice(2, 0, 0); // Colocar un espacio libre en el centro
    this.bingoCard.addColumn("N", numbers);
    return this;
  }

  buildColumnG(): this {
    const numbers = this.generateUniqueNumbers(46, 60, 5);
    this.bingoCard.addColumn("G", numbers);
    return this;
  }

  buildColumnO(): this {
    const numbers = this.generateUniqueNumbers(61, 75, 5);
    this.bingoCard.addColumn("O", numbers);
    return this;
  }

  getBingoCard(): BingoCard {
    const card = this.bingoCard;
    this.reset(); // Resetea el builder después de obtener el cartón
    return card;
  }
}
