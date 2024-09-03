import { Server, Socket } from 'socket.io';
import { Game } from "../models/Game";

export const gameSocket = (io: Server, socket: Socket) => {
  // Draw a ball
  socket.on("draw ball", async (gameId) => {
    try {
      const game = await Game.findById(gameId);
      // TODO: emit a error and validate in frontend
      if (!game) {
        const error = new Error("Game not found");
        return
      }
      if (game.active === false) {
        const error = new Error("Game is not active");
        return
      }

      const { drawnNumbers, unsortedNumbers } = game;

      const number = unsortedNumbers.pop();
      drawnNumbers.push(number);

      if (unsortedNumbers.length === 0) {
        game.active = false;
        await game.save();

        //TODO: emit a error message to all players
        return
      }

      await game.save();
      console.log("ball drawn", number);
      io.emit("ball drawn", number);
    } catch (error) {
      console.log(error);
      //TODO: emit a error message to all players
    }
  });
  // generate a list of unsorted numbers from 1 to 75
  // const unsortedNumbers = generateUnsortedNumbers(75);

  // const interval = setInterval(() => {
  //   function drawnNumbers() {
  //     if (unsortedNumbers.length === 0) {
  //       // throw new Error("Ya se han generado todos los números del 1 al 75.");
  //       clearInterval(interval);
  //       return null;
  //     }
  //     return unsortedNumbers.pop();
  //   }

  //   const drawnNumber = drawnNumbers();

  //   io.emit("ball drawn", drawnNumber);
  // }, 5000);
};
