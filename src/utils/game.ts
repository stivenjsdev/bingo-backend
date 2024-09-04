export function generateUnsortedNumbers(length: number): number[] {
  const numbers = Array.from({ length: length }, (_, i) => i + 1);
  // Desordenar el array utilizando el algoritmo de Fisher-Yates
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
}

export function generateRandomFourDigitNumber(): number {
  return Math.floor(10000 + Math.random() * 90000);
}

export function getRandomNumbers(
  min: number,
  max: number,
  count: number
): number[] {
  const numbers = [];
  while (numbers.length < count) {
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numbers.includes(randomNumber)) {
      numbers.push(randomNumber);
    }
  }
  return numbers;
}

export function generateBingoCard(): number[] {
  const bingoCard = [];
  const columnN = getRandomNumbers(31, 45, 4);
  columnN.splice(Math.floor(columnN.length / 2), 0, 0);
  bingoCard.push(getRandomNumbers(1, 15, 5)); // 5 números del 1 al 15
  bingoCard.push(getRandomNumbers(16, 30, 5)); // 5 números del 16 al 30
  bingoCard.push(columnN); // 4 números del 31 al 45 y un espacio en blanco representado por un cero
  bingoCard.push(getRandomNumbers(46, 60, 5)); // 5 números del 46 al 60
  bingoCard.push(getRandomNumbers(61, 75, 5)); // 5 números del 61 al 75
  return bingoCard;
}
