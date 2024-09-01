export function generateUnsortedNumbers(length: number): number[] {
  const numbers = Array.from({ length: length }, (_, i) => i + 1);
  // Desordenar el array utilizando el algoritmo de Fisher-Yates
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
}
