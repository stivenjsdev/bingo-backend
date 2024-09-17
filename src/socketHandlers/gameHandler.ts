import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import { UserAdmin } from "../models/UserAdmin";
import { GameService } from "../services/gameService";
import { capitalizeWords } from "../utils/game";

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

export const gameHandler = (io: Server, socket: Socket) => {
  // Socket disconnection
  socket.on("disconnect", async () => {
    try {
      console.log("disconnect handler", socket.id);
      const gameState = await GameService.disconnectPlayer(socket.id);
      // io.to(game.id).emit("player-disconnected", game);
      // if gameState is null, it means the user is admin/host. it is not necessary to do anything
      if (!gameState) return;
      // emit to dashboard and players to update selected game
      io.to(gameState.id).emit("gameUpdate", gameState);
      console.log("user disconnected", socket.id);
    } catch (error) {
      console.log("GameHandler.disconnect", error);
    }
  });

  // Join to game room
  socket.on("joinGame", async (gameId: string, playerId: string | null) => {
    try {
      console.log("joinGame handler", gameId, playerId);
      // join room
      socket.join(gameId);

      const gameState = await GameService.joinPlayerToGame(
        gameId,
        playerId,
        socket.id
      );

      // io.to(gameId).emit("player-joined-game", gameState);
      // emit to dashboard and player to update selected game
      io.to(gameId).emit("gameUpdate", gameState);

      // todo: maybe the welcome message should be run always when a player joins the game
      // emit to player to welcome message.
      socket.emit("joinedGame");
      console.log("User has joined the game room:", gameId, socket.id);
    } catch (error) {
      const message =
        "No has podido unirte a la juego, por favor intenta de nuevo";
      const icon: SweetAlertIcon = "error";
      socket.emit("message", message, icon);
      console.log(error);
    }
  });

  // Leave room
  socket.on("leaveRoom", (room) => {
    try {
      // emitted from dashboard when admin/host leaves the selected game
      socket.leave(room);
      console.log(`client ${socket.id}  has leave the room ${room}`);
    } catch (error) {
      console.log(error);
    }
  });

  // Take out the ball
  // socket.on("takeBallOut", async (token, gameId) => {
  socket.on("takeBallOut", async (gameId: string) => {
    console.log("takeBallOut handler", gameId);
    try {
      // const user = await authenticateSocket(token);
      // if (!user) {
      //   const error = new Error("get-game - Unauthorized User not found");
      //   throw error;
      // }

      const { game: gameState, number: ball } = await GameService.takeBallOut(
        gameId
      );

      // emit to all players the ball taken out
      io.to(gameId).emit("ballTakenOut", ball);
      // emit to all users the updated game state
      io.to(gameId).emit("gameUpdate", gameState);

      // emit to all users a message when the game starts
      const hasGameStarted = gameState?.chosenNumbers?.length === 1;
      if (hasGameStarted) {
        const message =
          "El Juego ha iniciado, se ha sacado la primera balota. ¡Buena suerte!";
        const icon: SweetAlertIcon = "success";
        io.to(gameId).emit("message", message, icon);
      }
    } catch (error) {
      console.log(error);
      // io.to(gameId).emit("ballTakenOut", null, error.message);
      const message = "Error al tomar la balota, por favor intente de nuevo";
      const icon: SweetAlertIcon = "error";
      socket.emit("message", message, icon);
    }
  });

  // Reset game
  // socket.on("reset-game", async (token, gameId) => {
  socket.on("resetGame", async (gameId: string) => {
    try {
      console.log("resetGame handler", gameId);
      // const user = await authenticateSocket(token);
      // if (!user) {
      //   const error = new Error("get-game - Unauthorized User not found");
      //   throw error;
      // }

      const gameState = await GameService.resetGame(gameId);

      io.to(gameId).emit("gameUpdate", gameState);
      io.to(gameId).emit("gameRestarted");

      // emit to all users a message when the game restarts
      const message = "El juego ha sido reiniciado";
      const icon: SweetAlertIcon = "warning";
      io.to(gameId).emit("message", message, icon);
      console.log("game restarted", gameId);
    } catch (error) {
      console.log(error);
    }
  });

  // Bingo!
  socket.on("bingo!", async (gameId: string, playerId: string) => {
    try {
      console.log("bingo! handler", gameId, playerId);

      const {
        game: gameState,
        playerName,
        win,
      } = await GameService.bingo(gameId, playerId);

      if (!win) {
        const message = `${
          playerName ? capitalizeWords(playerName) : "Anónimo"
        } ha cantado bingo!, pero no ha completado el cartón.`;
        const icon: SweetAlertIcon = "warning";
        io.to(gameId).emit("message", message, icon);
        console.log("The player has won", playerName);
      } else {
        const message = `${
          playerName ? capitalizeWords(playerName) : "Anónimo"
        } ha cantado bingo! ¡Felicidades ha ganado el juego! 🥳`;
        const icon: SweetAlertIcon = "success";
        io.to(gameId).emit("message", message, icon);
        io.to(gameId).emit("gameOver");
        io.to(gameId).emit("gameUpdate", gameState);
      }
    } catch (error) {
      console.log(error);
    }
  });

  // Get Games
  // socket.on("getGames", async (token) => {
  socket.on("getGames", async () => {
    // socket.emit("games", games);
    try {
      console.log("getGames handler");
      // const user = await authenticateSocket(token);
      // if (!user) {
      //   const error = new Error("get-games - Unauthorized User not found");
      //   throw error;
      // }
      // const games = await Game.find({ userAdmin: userId });
      const games = await GameService.getGames();
      socket.emit("games", games);
    } catch (error) {
      console.log(error);
      const message = "Error al obtener los juegos, por favor intente de nuevo";
      const icon: SweetAlertIcon = "error";
      socket.emit("message", message, icon);
    }
  });

  // Get Games By Id
  // socket.on("getGame", async (token, gameId) => {
  socket.on("getGame", async (gameId: string) => {
    // socket.emit("game", game);
    try {
      console.log("getGame handler", gameId);
      // const user = await authenticateSocket(token);
      // if (!user) {
      //   const error = new Error("get-game - Unauthorized User not found");
      //   throw error;
      // }
      const game = await GameService.getGame(gameId);
      if (!game) {
        console.log("getGame: Game not found");
        const message = "Error Juego no encontrado, por favor intente de nuevo";
        const icon: SweetAlertIcon = "error";
        socket.emit("message", message, icon);
        return;
      }

      socket.emit("game", game);
    } catch (error) {
      console.log(error);
      const message = "Error al obtener el Juego, por favor intente de nuevo";
      const icon: SweetAlertIcon = "error";
      socket.emit("message", message, icon);
    }
  });

  // Create Player
  // socket.on("createPlayer", async (token, newPlayer) => {
  socket.on(
    "createPlayer",
    async (newPlayer: { name: string; wpNumber: string; gameId: string }) => {
      // socket.emit("player created", game);
      try {
        console.log("createPlayer handler", newPlayer);
        // const user = await authenticateSocket(token);
        // validate authentication
        // if (!user) {
        //   const error = new Error("create-player - Unauthorized User not found");
        //   throw error;
        // }

        const gameState = await GameService.createPlayer(newPlayer);
        if (!gameState) {
          const message =
            "Error al crear el jugador, por favor intente de nuevo";
          const icon: SweetAlertIcon = "error";
          socket.emit("message", message, icon);
          return;
        }
        // emit to all users the updated game state
        io.to(gameState.id).emit("gameUpdate", gameState);
        // socket.emit("gameUpdate", gameState); // if exists any error
      } catch (error) {
        console.log(error);
        const message = "Error al crear el jugador, por favor intente de nuevo";
        const icon: SweetAlertIcon = "error";
        socket.emit("message", message, icon);
      }
    }
  );

  // Delete Player
  // socket.on("delete-player", async (token, playerId, gameId) => {
  socket.on("deletePlayer", async (playerId: string, gameId: string) => {
    // socket.emit("playerDeleted", game);
    try {
      console.log("deletePlayer handler", playerId, gameId);
      // const user = await authenticateSocket(token);
      // if (!user) {
      //   const error = new Error("delete-player - Unauthorized User not found");
      //   throw error;
      // }

      const gameState = await GameService.deletePlayer(playerId, gameId);
      if (!gameState) {
        const message =
          "Error al eliminar el jugador, por favor intente de nuevo";
        const icon: SweetAlertIcon = "error";
        socket.emit("message", message, icon);
        return;
      }

      io.to(gameId).emit("gameUpdate", gameState);
      const message = "El jugador ha sido eliminado exitosamente";
      const icon: SweetAlertIcon = "success";
      socket.emit("message", message, icon);
    } catch (error) {
      console.log(error);
      const message =
        "Error al eliminar el jugador, por favor intente de nuevo";
      const icon: SweetAlertIcon = "error";
      socket.emit("message", message, icon);
    }
  });

  // Delete Game
  // socket.on("delete-game", async (token, gameId) => {
  socket.on("deleteGame", async (gameId) => {
    // socket.emit("game-deleted", games, message);
    try {
      console.log("deleteGame handler", gameId);
      // const user = await authenticateSocket(token);
      // if (!user) {
      //   const error = new Error("delete-game - Unauthorized User not found");
      //   throw error;
      // }
      const gamesState = await GameService.deleteGame(gameId);
      if (!gamesState) {
        const message =
          "Error al eliminar el juego, por favor intente de nuevo";
        const icon: SweetAlertIcon = "error";
        socket.emit("message", message, icon);
        return;
      }
      socket.emit("gameDeleted", gamesState);
    } catch (error) {
      console.log(error);
      const message = "Error al eliminar el juego, por favor intente de nuevo";
      const icon: SweetAlertIcon = "error";
      socket.emit("message", message, icon);
    }
  });

  // socket.on("changeCard", async (token, playerId, gameId) => {
  socket.on("changeCard", async (playerId, gameId) => {
    // socket.emit("card-changed", game, player, message);
    try {
      console.log("changeCard handler", playerId, gameId);
      // const user = await authenticateSocket(token);
      // if (!user) {
      //   const error = new Error("delete-game - Unauthorized User not found");
      //   throw error;
      // }

      const { game: gameState, player } = await GameService.changeCard(
        playerId,
        gameId
      );

      if (!gameState || !player) {
        const message =
          "Error al cambiar el cartón, por favor intente de nuevo";
        const icon: SweetAlertIcon = "error";
        socket.emit("message", message, icon);
        return;
      }

      io.to(gameId).emit("cardChanged", player);
      io.to(gameId).emit("gameUpdate", gameState);

      const message = `El cartón de ${player.name} ha sido cambiado exitosamente`;
      const icon: SweetAlertIcon = "success";
      socket.emit("message", message, icon);
    } catch (error) {
      console.log(error);
      const message = "Error al cambiar el cartón, por favor intente de nuevo";
      const icon: SweetAlertIcon = "error";
      socket.emit("message", message, icon);
    }
  });
};
