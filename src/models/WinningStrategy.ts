import { BingoCard } from "./BingoCard";

// Interfaz para WinningStrategy
export interface WinningStrategy {
  checkWin(card: BingoCard, drawnNumbers: Set<number>): boolean;
}

export class HorizontalLineStrategy implements WinningStrategy {
  checkWin(card: BingoCard, drawnNumbers: Set<number>): boolean {
    for (let i = 0; i < 5; i++) {
      let complete = true;
      for (let col of ["B", "I", "N", "G", "O"]) {
        const number = card.getCard().get(col)?.[i];
        if (number !== 0 && !drawnNumbers.has(number!)) {
          complete = false;
          break;
        }
      }
      if (complete) return true;
    }
    return false;
  }
}

export class VerticalLineStrategy implements WinningStrategy {
  checkWin(card: BingoCard, drawnNumbers: Set<number>): boolean {
    for (let col of ["B", "I", "N", "G", "O"]) {
      let complete = true;
      for (let i = 0; i < 5; i++) {
        const number = card.getCard().get(col)?.[i];
        if (number !== 0 && !drawnNumbers.has(number!)) {
          complete = false;
          break;
        }
      }
      if (complete) return true;
    }
    return false;
  }
}

export class DiagonalStrategy implements WinningStrategy {
  checkWin(card: BingoCard, drawnNumbers: Set<number>): boolean {
    // Diagonal principal
    let diagonal1 = true;
    for (let i = 0; i < 5; i++) {
      const col = ["B", "I", "N", "G", "O"][i];
      const number = card.getCard().get(col)?.[i];
      if (number !== 0 && !drawnNumbers.has(number!)) {
        diagonal1 = false;
        break;
      }
    }

    // Diagonal secundaria
    let diagonal2 = true;
    for (let i = 0; i < 5; i++) {
      const col = ["B", "I", "N", "G", "O"][i];
      const number = card.getCard().get(col)?.[4 - i];
      if (number !== 0 && !drawnNumbers.has(number!)) {
        diagonal2 = false;
        break;
      }
    }

    return diagonal1 || diagonal2;
  }
}

export class CornersStrategy implements WinningStrategy {
  checkWin(card: BingoCard, drawnNumbers: Set<number>): boolean {
    const corners = [
      card.getCard().get("B")?.[0], // Top-left
      card.getCard().get("O")?.[0], // Top-right
      card.getCard().get("B")?.[4], // Bottom-left
      card.getCard().get("O")?.[4], // Bottom-right
    ];

    return corners.every((num) => drawnNumbers.has(num!));
  }
}

export class FrameStrategy implements WinningStrategy {
  checkWin(card: BingoCard, drawnNumbers: Set<number>): boolean {
    // Verifica los bordes (marco completo)
    const frameNumbers: number[] = [];

    // Agrega la primera y última fila
    for (let col of ["B", "I", "N", "G", "O"]) {
      frameNumbers.push(card.getCard().get(col)?.[0]!); // Primera fila
      frameNumbers.push(card.getCard().get(col)?.[4]!); // Última fila
    }

    // Agrega la primera y última columna (excluyendo ya los bordes de la fila)
    for (let i = 1; i < 4; i++) {
      frameNumbers.push(card.getCard().get("B")?.[i]!); // Primera columna
      frameNumbers.push(card.getCard().get("O")?.[i]!); // Última columna
    }

    return frameNumbers.every((num) => drawnNumbers.has(num));
  }
}

export class FullCardStrategy implements WinningStrategy {
  checkWin(card: BingoCard, drawnNumbers: Set<number>): boolean {
    for (let col of ["B", "I", "N", "G", "O"]) {
      for (let num of card.getCard().get(col)!) {
        if (num !== 0 && !drawnNumbers.has(num)) {
          return false;
        }
      }
    }
    return true;
  }
}
