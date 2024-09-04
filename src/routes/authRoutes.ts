import { Router } from "express";
import { body } from "express-validator";
import { AuthController } from "../controllers/AuthController";
import { authenticate } from "../middleware/auth";
import { adminAuthenticate } from "../middleware/authAdmin";
import { handleInputErrors } from "../middleware/validation";

const router = Router();

router.post(
  "/admin/create-account",
  body("username").notEmpty().withMessage("Username is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("password_confirmation").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords must match");
    }
    return true;
  }),
  body("email").isEmail().withMessage("Email is invalid"),
  handleInputErrors,
  AuthController.adminCreateAccount
);

router.post(
  "/admin/login",
  body("email").isEmail().withMessage("Email is invalid"),
  body("password").notEmpty().withMessage("Password is required"),
  handleInputErrors,
  AuthController.adminLogin
);

router.post(
  "/login",
  body("code")
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 8, max: 8 })
    .withMessage("Code must be 8 characters long"),
  handleInputErrors,
  AuthController.login
);

router.get("/user", authenticate, AuthController.user);

router.post(
  "/create-player",
  adminAuthenticate,
  body("name").notEmpty().withMessage("Name is required"),
  body("wpNumber").notEmpty().withMessage("WP Number is required"),
  body("gameId").isMongoId().withMessage("Invalid Game ID"),
  handleInputErrors,
  AuthController.createPlayer
);

export default router;
