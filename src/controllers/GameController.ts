import type { Request, Response } from "express";
import Game from "../models/Game";

export class GameController {
  static createGame = async (req: Request, res: Response) => {
    console.log(req.body);
    const game = new Game(req.body);
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
    }
  };

  static getGameById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const game = await Game.findById(id);

      if (!game) {
        const error = new Error("Game not found");
        return res.status(404).json({ error: error.message });
      }
      res.json(game);
    } catch (error) {
      console.log(error);
    }
  };
}
