import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import { Game } from "../models/Game";
import { User } from "../models/User";
import { UserAdmin } from "../models/UserAdmin";
import {
  generateBingoCard,
  generateRandomFourDigitNumber,
  generateUnsortedNumbers,
  validateWinner,
} from "../utils/game";

export type SweetAlertIcon =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "question";

const authenticateSocket = async (token: string) => {
  try {
    if (!token) {
      const error = new Error("Unauthorized");
      throw error;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (typeof decoded === "object" && decoded.id) {
      const user = await UserAdmin.findById(decoded.id).select(
        "_id username email"
      );
      if (!user) {
        const error = new Error("User not found");
        throw error;
      }

      return user;
    }
  } catch (error) {
    console.error(error);
  }
};

export const gameSocket = (io: Server, socket: Socket) => {
  // Join a room game
  socket.on("join-game", async (gameId) => {
    try {
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
      if (!game) {
        const error = new Error("join game - Game not found");
        throw error;
        // return;
      }
      socket.join(gameId);
      socket.emit("joined-game", game);
      console.log("player joined game", gameId);
    } catch (error) {
      // todo: emit a generic error event to the player(socket) updated: maybe this is not necessary
      console.log(error);
    }
  });

  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    console.log(`Cliente ${socket.id} ha dejado la sala ${room}`);
  });

  // Take out the ball
  socket.on("takeOut-ball", async (token, gameId) => {
    console.log("take out ball");
    try {
      const user = await authenticateSocket(token);
      if (!user) {
        const error = new Error("get-game - Unauthorized User not found");
        throw error;
      }
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
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

      if (game.unsortedNumbers.length === 0) {
        const error = new Error(
          "take out ball - There are no more balls to take out"
        );
        throw error;
      }
      const number = game.unsortedNumbers.pop();
      game.chosenNumbers.push(number);

      await game.save();
      console.log("ball taken out", number);
      console.log("remaining balls", game.unsortedNumbers.length);
      console.log("---");
      io.to(gameId).emit("ball-takenOut", number, game, "ball taken out");
    } catch (error) {
      console.log(error);
      io.to(gameId).emit("ball-takenOut", null, null, error.message);
    }
  });

  // Reset game
  socket.on("reset-game", async (token, gameId) => {
    try {
      const user = await authenticateSocket(token);
      if (!user) {
        const error = new Error("get-game - Unauthorized User not found");
        throw error;
      }
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
      if (!game) {
        const error = new Error("reset game - Game not found");
        throw error;
        // return;
      }
      game.winner = undefined;
      game.chosenNumbers = [];
      game.unsortedNumbers = generateUnsortedNumbers(75);
      game.active = true;
      console.log(game);
      await game.save();
      io.to(gameId).emit("game-restarted", game);
      console.log("reset game", gameId);
    } catch (error) {
      console.log(error);
    }
  });

  // Bingo!
  socket.on("bingo!", async (gameId, playerId) => {
    try {
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
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
      // validate if player has won
      if (win) {
        game.winner = player;
        game.active = false;
        await game.save();
        io.to(gameId).emit("game-over", game);
        console.log("winner!", player.name);
      } else {
        console.log("not a winner", player.name);
        const message: string =
          "Un jugador ha cantado bingo, pero no ha ganado, el juego continuará";
        const icon: SweetAlertIcon = "error";
        io.to(gameId).emit("message", message, icon);
      }
    } catch (error) {
      console.log(error);
    }
  });

  // Get Games
  socket.on("get-games", async (token) => {
    // socket.emit("games", games, message);
    console.log("get-games");
    try {
      const user = await authenticateSocket(token);
      if (!user) {
        const error = new Error("get-games - Unauthorized User not found");
        throw error;
      }
      // const games = await Game.find({ userAdmin: userId });
      const games = await Game.find({});
      socket.emit("games", games, "games obtained successfully");
    } catch (error) {
      console.log(error);
      socket.emit("games", null, error.message);
    }
  });

  // Get Games By Id
  socket.on("get-game", async (token, gameId) => {
    // socket.emit("game", game, message);
    console.log("get-game");
    try {
      const user = await authenticateSocket(token);
      if (!user) {
        const error = new Error("get-game - Unauthorized User not found");
        throw error;
      }
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
      if (!game) {
        const error = new Error("get-game - Game not found");
        throw error;
      }
      socket.emit("game", game, "game obtained successfully");
    } catch (error) {
      console.log(error);
      socket.emit("game", null, error.message);
    }
  });

  // Create Player
  socket.on("create-player", async (token, newPlayer) => {
    // socket.emit("player created", game, message);
    console.log("create-player");
    try {
      const user = await authenticateSocket(token);
      // validate authentication
      if (!user) {
        const error = new Error("create-player - Unauthorized User not found");
        throw error;
      }
      // validate if game exists
      const game = await Game.findById(newPlayer.gameId)
        .populate("players")
        .populate("winner");
      if (!game) {
        const error = new Error("create-player - Game not found");
        throw error;
      }
      // validate if player exists in game
      const playerExists = game.players.find(
        (player) => player.wpNumber === newPlayer.wpNumber
      );
      if (playerExists) {
        const error = new Error("create-player - Player already exists");
        throw error;
      }
      // create player
      // Create a User
      const playerData = {
        name: newPlayer.name,
        wpNumber: newPlayer.wpNumber,
        code:
          newPlayer.name.substring(0, 3).toLowerCase() +
          generateRandomFourDigitNumber(),
        bingoCard: generateBingoCard(),
        game: newPlayer.gameId,
        active: true, // todo: delete this if model changes
      };
      const player = new User(playerData);

      // Add user to game
      game.players.push(player);

      await Promise.allSettled([player.save(), game.save()]);
      console.log(game.players);
      io.to(newPlayer.gameId).emit(
        "player-created",
        game,
        "player created successfully"
      );
    } catch (error) {
      console.log(error);
      socket.emit("player-created", null, error.message);
    }
  });
};
