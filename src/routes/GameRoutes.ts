import { Router } from "express";
import { GameController } from "../controllers/GameController";

const router = Router();

router.post("/", GameController.createGame);
router.get("/", GameController.getAllGames);

export default router;