import { Socket } from "socket.io";
import { Game } from "../models/Game";
import { User } from "../models/User";
import {
  generateBingoCard,
  generateRandomFourDigitNumber,
  generateUnsortedNumbers,
  validateWinner,
} from "../utils/game";

export class GameService {
  static disconnectPlayer = async (socketId: Socket["id"]) => {
    try {
      // find player by socket id
      const player = await User.findOne({ socketId });
      // if player does not exist, it means user is admin/host. it is not necessary to do anything
      if (player) {
        // set player offline
        player.online = false;
        player.socketId = undefined;
        await player.save();
        // get game with updated players
        const game = await Game.findById(player.game)
          .populate("players")
          .populate("winner");
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
        await User.findByIdAndUpdate(playerId, {
          online: true,
          socketId: socketId,
        });
        // get updated game
        const game = await Game.findById(gameId)
          .populate("players")
          .populate("winner");
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
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
      // validate if game exists, is active and has balls to take out
      if (!game) {
        console.log("GameService.takeBallOut: Game not found");
      }
      if (game.active === false) {
        console.log("GameService.takeBallOut: Game is not active");
      }
      if (game.unsortedNumbers.length === 0) {
        console.log("GameService.takeBallOut: All balls are out");
      }
      // take number out
      const number = game.unsortedNumbers.pop();
      // push taken number to chosen numbers
      game.chosenNumbers.push(number);
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
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
      // validate if game exists
      if (!game) {
        console.log("GameService.resetGame: Game not found");
      }
      // reset game
      game.winner = undefined;
      game.chosenNumbers = [];
      game.unsortedNumbers = generateUnsortedNumbers(75);
      game.active = true;
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
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
      // validate if game exists and is active
      if (!game) {
        console.log("GameService.bingo: Game not found");
      }
      if (game.active === false) {
        console.log("GameService.bingo: Game is not active");
      }

      // find player by id in game players
      const player = game.players.find((player) => player.id === playerId);
      // validate if player exists
      if (!player) {
        console.log("GameService.bingo: Player not found");
      }
      // validate if player has won
      const win = validateWinner(player.bingoCard, game.chosenNumbers);
      if (win) {
        // set game winner
        game.winner = player;
        game.active = false;
        // save game
        await game.save();
      }
      return { game, playerName: player.name, win };
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

  static getGame = async (gameId: string) => {
    try {
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
      return game;
    } catch (error) {
      console.log("GameService.getGame: ", error);
    }
  };

  static createPlayer = async (newPlayer: {
    name: string;
    wpNumber: string;
    gameId: string;
  }) => {
    try {
      // validate if game exists
      const game = await Game.findById(newPlayer.gameId)
        .populate("players")
        .populate("winner");
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
      return game;
    } catch (error) {
      console.log("GameService.createPlayer: ", error);
    }
  };

  static deletePlayer = async (playerId: string, gameId: string) => {
    // get game
    const game = await Game.findById(gameId)
      .populate("players")
      .populate("winner");
    // validate if game exists
    if (!game) {
      console.log("GameService.deletePlayer: Game not found");
      return;
    }
    // find player by id in game players
    const player = game.players.find((player) => player.id === playerId);
    // validate if player exists
    if (!player) {
      console.log("GameService.deletePlayer: Player not found");
      return;
    }
    // remove player from game
    const playerIndex = game.players.findIndex(
      (player) => player.id === playerId
    );
    game.players.splice(playerIndex, 1);
    // save game and delete player user
    await Promise.all([User.findByIdAndDelete(playerId), game.save()]);
    return game;
  };

  static deleteGame = async (gameId: string) => {
    try {
      // get game
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
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
      const games = await Game.find({});
      return games;
    } catch (error) {
      console.log("GameService.deleteGame: ", error);
    }
  };

  static changeCard = async (playerId: string, gameId: string) => {
    try {
      // change player card
      const player = await User.findByIdAndUpdate(
        playerId,
        {
          bingoCard: generateBingoCard(),
        },
        { new: true }
      ).populate("game");
      // validate if player exists
      if (!player) {
        console.log("GameService.changeCard: Player not found");
        return;
      }
      // get game with updated players
      const game = await Game.findById(gameId)
        .populate("players")
        .populate("winner");
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
}
