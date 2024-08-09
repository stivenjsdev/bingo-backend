import { Router } from "express";
import { body } from "express-validator";
import { GameController } from "../controllers/GameController";
import { handleInputErrors } from "../middleware/validation";

const router = Router();

router.post(
  "/", 
  body("gameName").isString().isLength({ min: 3 }).notEmpty().withMessage("Game Name is required"),
  body("date").notEmpty().withMessage("Date is required"),
  handleInputErrors,
  GameController.createGame
);

router.get("/", GameController.getAllGames);

export default router;