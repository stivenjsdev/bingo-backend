import { Schema } from "mongoose";
import { Socket } from "socket.io";
import { Game } from "../models/Game";
import { User } from "../models/User";
import {
  CornersStrategy,
  DiagonalStrategy,
  FrameStrategy,
  FullCardStrategy,
} from "../models/WinningStrategy";

export class GameService {
  static disconnectPlayer = async (socketId: Socket["id"]) => {
    try {
      // find player by socket id
      const player = await User.findOne({ socketId });
      // if player does not exist, it means user is admin/host. it is not necessary to do anything
      if (player) {
        // set player offline
        player.setOffline();
        await player.save();
        // get game with updated players
        const game = await this.getGame(player.game);
        if (!game) {
          console.log("GameService.disconnectPlayer: Game not found");
        }
        // return game
        return game;
      }
    } catch (error) {
      console.log("GameService.disconnectPlayer: ", error);
    }
  };

  static joinPlayerToGame = async (
    gameId: string,
    playerId: string | null,
    socketId: Socket["id"]
  ) => {
    try {
      // if playerId is null, it means the user is the admin/host. it is not necessary to do anything
      if (playerId) {
        // set player online
        const player = await this.getPlayer(playerId);
        if (!player) {
          console.log("GameService.joinPlayerToGame: Player not found");
          return;
        }
        player.setOnline(socketId);
        await player.save();
        // get updated game
        const game = await this.getGame(gameId);
        if (!game) {
          console.log("GameService.joinPlayerToGame: Game not found");
        }
        // return game
        return game;
      }
    } catch (error) {
      console.log("GameService.joinUserToGame: ", error);
    }
  };

  static takeBallOut = async (gameId: string) => {
    try {
      // get game
      const game = await this.getGame(gameId);
      if (!game) {
        console.log("GameService.takeBallOut: Game not found");
        return;
      }
      const number = game.drawBall();
      // save game
      await game.save();
      // return game
      return { game, number };
    } catch (error) {
      console.log("GameService.takeBallOut: ", error);
    }
  };

  static resetGame = async (gameId: string) => {
    try {
      // get game
      const game = await this.getGame(gameId);
      // validate if game exists
      if (!game) {
        console.log("GameService.resetGame: Game not found");
        return;
      }
      // reset game
      game.resetGame();
      // save game
      await game.save();
      // return game
      return game;
    } catch (error) {
      console.log("GameService.resetGame: ", error);
    }
  };

  static bingo = async (gameId: string, playerId: string) => {
    try {
      // get game
      const game = await this.getGame(gameId);
      // validate if game exists and is active
      if (!game) {
        console.log("GameService.bingo: Game not found");
        return;
      }
      if (game.active === false) {
        console.log("GameService.bingo: Game is not active");
        return;
      }

      // find player by id in game players
      const player = game.players.find((player) => player.id === playerId);
      // validate if player exists
      if (!player) {
        console.log("GameService.bingo: Player not found");
        return;
      }
      // validate if player has won
      // set full card strategy
      const selectedGameType = [
        new FullCardStrategy(), // 0
        new DiagonalStrategy(), // 1
        new CornersStrategy(), // 2
        new FrameStrategy(), // 3
      ];
      game.setStrategy(game.gameType ? selectedGameType[game.gameType] : new FullCardStrategy());
      const hasPlayerWon = game.checkWin(player.getBingoCard());
      if (hasPlayerWon) {
        // set game winner
        game.winner = player;
        game.active = false;
        // save game
        await game.save();
      }
      return { game, playerName: player.name, hasPlayerWon };
    } catch (error) {
      console.log("GameService.bingo: ", error);
    }
  };

  static getGames = async () => {
    try {
      const games = await Game.find({});
      return games;
    } catch (error) {
      console.log("GameService.getGames: ", error);
    }
  };

  static getGame = async (gameId: string | Schema.Types.ObjectId) => {
    try {
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
      return game;
    } catch (error) {
      console.log("GameService.getGame: ", error);
    }
  };

  static getPlayer = async (playerId: string) => {
    try {
      const player = await User.findById(playerId).populate("game");
      return player;
    } catch (error) {
      console.log("GameService.getPlayer: ", error);
    }
  };

  static createPlayer = async (newPlayer: {
    name: string;
    wpNumber: string;
    gameId: string;
  }) => {
    try {
      // validate if game exists
      const game = await this.getGame(newPlayer.gameId);
      if (!game) {
        console.log("GameService.createPlayer: Game not found");
        return;
      }
      // validate if player exists in game
      const playerExists = game.players.find(
        (player) => player.wpNumber === newPlayer.wpNumber
      );
      if (playerExists) {
        console.log("GameService.createPlayer: Player already exists");
        return;
      }
      // create player
      const playerData = {
        name: newPlayer.name,
        wpNumber: newPlayer.wpNumber,
        game: newPlayer.gameId,
      };
      const player = new User(playerData);
      player.setCode();
      player.changeBingoCard();
      // Add user to game
      game.players.push(player);
      // save player and game
      await Promise.all([player.save(), game.save()]);
      return { game };
    } catch (error) {
      console.log("GameService.createPlayer: ", error);
      throw error;
    }
  };

  static deletePlayer = async (playerId: string, gameId: string) => {
    // get game
    const game = await this.getGame(gameId);
    // validate if game exists
    if (!game) {
      console.log("GameService.deletePlayer: Game not found");
      return;
    }
    // remove player from game
    game.removePlayer(playerId);
    // save game and delete player user
    await Promise.all([User.findByIdAndDelete(playerId), game.save()]);
    return game;
  };

  static deleteGame = async (gameId: string) => {
    try {
      // get game
      const game = await this.getGame(gameId);
      if (!game) {
        console.log("GameService.deleteGame: Game not found");
        return;
      }
      // delete all players from game
      for (const player of game.players) {
        await User.findByIdAndDelete(player.id);
        console.log("deleted player", player.name);
      }
      // delete game
      await Game.findByIdAndDelete(gameId);

      // get all games
      const games = await this.getGames();
      return games;
    } catch (error) {
      console.log("GameService.deleteGame: ", error);
    }
  };

  static changeCard = async (playerId: string, gameId: string) => {
    try {
      // get player
      const player = await this.getPlayer(playerId);
      // validate if player exists
      if (!player) {
        console.log("GameService.changeCard: Player not found");
        return;
      }
      // change player card
      player.changeBingoCard();
      // save player
      await player.save();
      // get game with updated players
      const game = await this.getGame(gameId);
      // validate if game exists
      if (!game) {
        console.log("GameService.changeCard: Game not found");
        return;
      }
      return { game, player };
    } catch (error) {
      console.log("GameService.changeCard: ", error);
    }
  };

  static changeGameType = async (gameId: string, gameType: number) => {
    try {
      // get game
      const game = await this.getGame(gameId);
      // validate if game exists
      if (!game) {
        console.log("GameService.changeGameType: Game not found");
        return;
      }
      // change game type
      game.gameType = gameType;
      // save game
      await game.save();
      return game;
    } catch (error) {
      console.log("GameService.changeGameType: ", error);
    }
  };
}
