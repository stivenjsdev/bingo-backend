import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import { Game } from "../models/Game";
import { User, UserType } from "../models/User";
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
  // Socket disconnection
  socket.on("disconnect", async () => {
    console.log("Player disconnected", socket.id);
    // find player by socket id
    const player = await User.findOne({ socketId: socket.id });
    if (player) {
      // set player offline
      player.online = false;
      player.socketId = undefined;
      await player.save();
      // get game with updated players
      const game = await Game.findById(player.game)
        .populate("players")
        .populate("winner");
      if (game && game.id) {
        // emit player disconnected
        io.to(game.id).emit("player-disconnected", game);
      }
    }
  });

  // Join a room game
  socket.on(
    "join-game",
    async (gameId: string, playerId: UserType["_id"] | null) => {
      try {
        // join room
        socket.join(gameId);
        // if playerId is null, it means the user is the admin/host
        if (playerId) {
          // set player online
          await User.findByIdAndUpdate(playerId, {
            online: true,
            socketId: socket.id,
          });
          // get game
          const game = await Game.findById(gameId)
            .populate("players")
            .populate("winner");
          if (!game) {
            const error = new Error("join game - Game not found");
            throw error;
          }
          io.to(gameId).emit("player-joined-game", game);
        }
        socket.emit("joined-game");
        console.log("User has joined the game room:", gameId, socket.id);
      } catch (error) {
        const message =
          "No has podido unirte a la juego, por favor intenta de nuevo";
        const icon: SweetAlertIcon = "error";
        socket.emit("message", message, icon);
        console.log(error);
      }
    }
  );

  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    console.log(`client ${socket.id}  has leave the room ${room}`);
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

      await Promise.all([player.save(), game.save()]);
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

  // Delete Player
  socket.on("delete-player", async (token, playerId, gameId) => {
    // socket.emit("player-deleted", game, message);
    console.log("delete-player");
    try {
      const user = await authenticateSocket(token);
      if (!user) {
        const error = new Error("delete-player - Unauthorized User not found");
        throw error;
      }
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
      if (!game) {
        const error = new Error("delete-player - Game not found");
        throw error;
      }
      const player = game.players.find((player) => player.id === playerId);
      if (!player) {
        const error = new Error("delete-player - Player not found in game");
        throw error;
      }
      const playerIndex = game.players.findIndex(
        (player) => player.id === playerId
      );
      game.players.splice(playerIndex, 1);
      await Promise.all([User.findByIdAndDelete(playerId), game.save()]);
      io.to(gameId).emit("player-deleted", game, "player deleted successfully");
    } catch (error) {
      console.log(error);
      socket.emit("player-deleted", null, error.message);
    }
  });

  // Delete Game
  socket.on("delete-game", async (token, gameId) => {
    // socket.emit("game-deleted", games, message);
    console.log("delete-game");
    try {
      const user = await authenticateSocket(token);
      if (!user) {
        const error = new Error("delete-game - Unauthorized User not found");
        throw error;
      }
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
      if (!game) {
        const error = new Error("delete-game - Game not found");
        throw error;
      }
      // delete game and all players
      for (const player of game.players) {
        await User.findByIdAndDelete(player.id);
        console.log("deleted player", player.name);
      }

      // delete game
      await Game.findByIdAndDelete(gameId);

      // get all games
      const games = await Game.find({});
      socket.emit("game-deleted", games, "game deleted successfully");
    } catch (error) {
      console.log(error);
      socket.emit("game-deleted", null, error.message);
    }
  });

  socket.on("change-card", async (token, playerId, gameId) => {
    // socket.emit("card-changed", game, player, message);
    console.log("change-card");
    try {
      const user = await authenticateSocket(token);
      if (!user) {
        const error = new Error("delete-game - Unauthorized User not found");
        throw error;
      }
      const player = await User.findByIdAndUpdate(
        playerId,
        {
          bingoCard: generateBingoCard(),
        },
        { new: true }
      );
      if (!player) {
        const error = new Error("change-card - Player not found");
        throw error;
      }
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
      if (!game) {
        const error = new Error("change-card - Game not found");
        throw error;
      }
      io.to(gameId).emit(
        "card-changed",
        game,
        player,
        "card changed successfully"
      );
    } catch (error) {
      console.log(error);
      socket.emit("card-changed", null, null, error.message);
    }
  });
};
