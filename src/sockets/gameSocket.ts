import { Server } from "socket.io";
import { generateUnsortedNumbers } from "../utils/game";

export const gameSocket = (io: Server) => {
  const unsortedNumbers = generateUnsortedNumbers(75);

  const interval = setInterval(() => {
    function drawnNumbers() {
      if (unsortedNumbers.length === 0) {
        // throw new Error("Ya se han generado todos los números del 1 al 75.");
        clearInterval(interval);
        return null;
      }
      return unsortedNumbers.pop();
    }

    const drawnNumber = drawnNumbers();

    io.emit("ball drawn", drawnNumber);
  }, 5000);
};
