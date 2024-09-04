import { Server, Socket } from "socket.io";
import { Game } from "../models/Game";

export const gameSocket = (io: Server, socket: Socket) => {
  // Join a room game
  socket.on("join game", async (gameId) => {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        const error = new Error("join game - Game not found");
        throw error;
        // return;
      }
      socket.join(gameId);
      socket.emit("joined game", game.drawnNumbers);
      console.log("player joined game", gameId);
    } catch (error) {
      // TODO: emit a generic error event to the player(socket)
      console.log(error);
    }
  });

  // Draw a ball
  socket.on("draw ball", async (gameId) => {
    try {
      const game = await Game.findById(gameId);
      // TODO: emit a error and validate in frontend
      if (!game) {
        const error = new Error("drawn ball - Game not found");
        throw error;
        // return;
      }
      if (game.active === false) {
        const error = new Error("drawn ball - Game is not active");
        throw error;
        // return;
      }

      const { drawnNumbers, unsortedNumbers } = game;

      const number = unsortedNumbers.pop();
      drawnNumbers.push(number);

      if (unsortedNumbers.length === 0) {
        game.active = false;
        await game.save();
        // TODO: emit a game over event to all players and adminUser.
        //TODO: emit a error message to adminUser
        return;
      }

      await game.save();
      console.log("ball drawn", number);
      console.log("remaining balls", unsortedNumbers.length);
      console.log("---");
      io.to(gameId).emit("ball drawn", number, drawnNumbers);
    } catch (error) {
      console.log(error);
      // TODO: emit a generic error event to the player(socket)
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
