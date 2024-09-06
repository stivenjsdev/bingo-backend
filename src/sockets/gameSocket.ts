import { Server, Socket } from "socket.io";
import { Game } from "../models/Game";
import { generateUnsortedNumbers, validateWinner } from "../utils/game";

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
      socket.emit("joined game", game.chosenNumbers);
      console.log("player joined game", gameId);
    } catch (error) {
      // TODO: emit a generic error event to the player(socket)
      console.log(error);
    }
  });

  // Take out the ball
  socket.on("takeOut ball", async (gameId) => {
    try {
      console.log("take out ball");
      const game = await Game.findById(gameId);
      // TODO: emit a error and validate in frontend
      if (!game) {
        const error = new Error("take out ball - Game not found");
        throw error;
        // return;
      }
      if (game.active === false) {
        const error = new Error("take out ball - Game is not active");
        throw error;
        // return;
      }
      
      const { chosenNumbers, unsortedNumbers } = game;
      
      if (unsortedNumbers.length === 0) {
        const error = new Error("take out ball - There are no more balls to take out");
        throw error;
      }
      const number = unsortedNumbers.pop();
      chosenNumbers.push(number);

      await game.save();
      console.log("ball taken out", number);
      console.log("remaining balls", unsortedNumbers.length);
      console.log("---");
      io.to(gameId).emit("ball taken out", number, chosenNumbers);
    } catch (error) {
      console.log(error);
      // TODO: emit a generic error event to the player(socket)
    }
  });

  // Reset game
  socket.on("reset game", async (gameId) => {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        const error = new Error("reset game - Game not found");
        throw error;
        // return;
      }
      // game.active = false;
      game.chosenNumbers = [];
      game.unsortedNumbers = generateUnsortedNumbers(75);
      game.active = true;
      delete game.winner
      await game.save();
      io.to(gameId).emit("game restarted");
      console.log("reset game", gameId);
    } catch (error) {
      console.log(error);
    }
  });

  // Bingo!
  socket.on("bingo!", async (gameId, playerId) => {
    try {
      // todo: emit a info message to all players
      const game = await Game.findById(gameId).populate("players");
      if (!game) {
        const error = new Error("bingo - Game not found");
        throw error;
        // return;
      }
      if (game.active === false) {
        const error = new Error("bingo - Game is not active");
        throw error;
        // return;
      }
      const player = game.players.find((player) => player.id === playerId);
      if (!player) {
        const error = new Error("bingo - Player not found in game");
        throw error;
        // return;
      }
      console.log("bingo!", player.name);
      const win = validateWinner(player.bingoCard, game.chosenNumbers);
      if (win) {
        game.winner = player.id;
        game.active = false;
        await game.save();
        io.to(gameId).emit("game over", player.name);
        console.log("winner!", player.name);
      } else {
        console.log("not a winner", player.name);
        // todo: emit a error message to all players
      }
    } catch (error) {
      console.log(error);
    }
  });
};
