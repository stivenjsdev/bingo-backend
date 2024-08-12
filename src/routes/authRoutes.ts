import { Router } from "express";
import { body } from "express-validator";
import { AuthController } from "../controllers/AuthController";
import { handleInputErrors } from "../middleware/validation";

const router = Router();

router.post(
  "/create-account",
  body("username").notEmpty().withMessage("Username is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("password_confirmation").custom((value, {req}) => {
    if (value !== req.body.password) {
      throw new Error("Passwords must match");
    }
    return true;
  }),
  body("email").isEmail().withMessage("Email is invalid"),
  handleInputErrors,
  AuthController.createAccount
);

export default router;
