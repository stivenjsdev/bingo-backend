import { Router } from "express";
import { body, param } from "express-validator";
import { GameController } from "../controllers/GameController";
import { handleInputErrors } from "../middleware/validation";

const router = Router();

router.post(
  "/",
  body("gameName")
    .isString()
    .isLength({ min: 3 })
    .notEmpty()
    .withMessage("Game Name is required"),
  body("date").notEmpty().withMessage("Date is required"),
  handleInputErrors,
  GameController.createGame
);

router.get("/", GameController.getAllGames);

router.get(
  "/:id",
  param("id").isMongoId().withMessage("Invalid Game ID"),
  handleInputErrors,
  GameController.getGameById
);

router.put(
  "/:id",
  param("id").isMongoId().withMessage("Invalid Game ID"),
  body("gameName")
    .isString()
    .isLength({ min: 3 })
    .notEmpty()
    .withMessage("Game Name is required"),
  body("date").notEmpty().withMessage("Date is required"),
  body("players")
    .notEmpty()
    .withMessage("Players is required")
    .isArray()
    .withMessage("Players must be an array"),
  body("numbersDrawn")
    .notEmpty()
    .withMessage("numbersDrawn is required")
    .isArray()
    .withMessage("numbersDrawn must be an array"),
  handleInputErrors,
  GameController.updateGame
);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage("Invalid Game ID"),
  handleInputErrors,
  GameController.deleteGame
);

export default router;
