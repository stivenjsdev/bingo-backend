import type { Request, Response } from "express";
import { Game } from "../models/Game";
import { generateUnsortedNumbers } from "../utils/game";

export class GameController {
  static createGame = async (req: Request, res: Response) => {
    console.log("GameController.createGame: ", req.body);
    // generate a list of unsorted numbers from 1 to 75
    const unsortedNumbers = generateUnsortedNumbers(75);
    const game = new Game({
      ...req.body,
      unsortedNumbers,
      userAdmin: req.adminUser._id,
    });
    try {
      await game.save();
      res.send("Game created successfully");
    } catch (error) {
      console.log(error);
      res.status(500).send("Error creating game");
    }
  };

  static getAllGames = async (req: Request, res: Response) => {
    try {
      const games = await Game.find({});
      res.json(games);
    } catch (error) {
      console.log(error);
      res.status(500).send("Error getting games");
    }
  };

  static getGameById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const game = await Game.findById(id).populate("players");

      if (!game) {
        const error = new Error("Game not found");
        return res.status(404).json({ error: error.message });
      }
      res.json(game);
    } catch (error) {
      console.log(error);
      res.status(500).send("Error getting game by id");
    }
  };

  static updateGame = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const game = await Game.findByIdAndUpdate(id, req.body);

      if (!game) {
        const error = new Error("Game not found");
        return res.status(404).json({ error: error.message });
      }

      await game.save();
      res.send("Game updated successfully");
    } catch (error) {
      console.log(error);
      res.status(500).send("Error updating game");
    }
  };

  static deleteGame = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const game = await Game.findById(id);
      if (!game) {
        const error = new Error("Game not found");
        return res.status(404).json({ error: error.message });
      }

      await game.deleteOne();
      res.send("Game deleted successfully");
    } catch (error) {
      console.log(error);
      res.status(500).send("Error updating game");
    }
  };

  static drawNumber = async (req: Request, res: Response) => {
    const { gameId } = req.body;
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        const error = new Error("Game not found");
        return res.status(404).json({ error: error.message });
      }
      if (game.active === false) {
        const error = new Error("Game is not active");
        return res.status(400).json({ error: error.message });
      }

      const { chosenNumbers, unsortedNumbers } = game;

      const number = unsortedNumbers.pop();
      chosenNumbers.push(number);
      
      if (unsortedNumbers.length === 0) {
        game.active = false;
        await game.save();
        return res.json({ message: "Game Over" });
      }

      await game.save();
      res.json({ number });
    } catch (error) {
      console.log(error);
      res.status(500).send("Error drawing number");
    }
  };
}
