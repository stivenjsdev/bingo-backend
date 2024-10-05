export type Card = Map<string, number[]>;

export class BingoCard {
  private card: Card;

  constructor(card: Card = new Map<string, number[]>()) {
    this.card = card;
  }

  addColumn(column: string, numbers: number[]) {
    this.card.set(column, numbers);
  }

  getCard(): Card {
    return this.card;
  }

  printCard() {
    console.log("B  | I  | N  | G  | O");
    for (let i = 0; i < 5; i++) {
      console.log(
        `${this.card.get("B")?.[i] || " "} | ${
          this.card.get("I")?.[i] || " "
        } | ${this.card.get("N")?.[i] || " "} | ${
          this.card.get("G")?.[i] || " "
        } | ${this.card.get("O")?.[i] || " "}`
      );
    }
  }
}
