import type { Request, Response } from "express";
import { Token } from "../models/Token";
import { UserAdmin } from "../models/UserAdmin";
import { comparePassword, hashPassword } from "../utils/auth";
import { generateToken } from "../utils/token";

export class AuthController {
  static createAccount = async (req: Request, res: Response) => {
    try {
      const { password, email } = req.body;

      // Check if user already exists
      const userExists = await UserAdmin.findOne({ email });

      if (userExists) {
        const error = new Error("User already exists");
        return res.status(409).json({ error: error.message });
      }

      // Create a User Admin
      const user = new UserAdmin(req.body);

      // Hash Password
      user.password = await hashPassword(password);

      // Generate a verification token
      const token = new Token();
      token.token = generateToken();
      token.user = user.id;

      await Promise.allSettled([user.save(), token.save()]);

      res.send(
        "Account created successfully, check your email to verify your account"
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await UserAdmin.findOne({ email });

      if (!user) {
        const error = new Error("User not found");
        return res.status(404).json({ error: error.message });
      }

      // Check if password is correct
      const isMatch = await comparePassword(password, user.password);

      if (!isMatch) {
        const error = new Error("Invalid password");
        return res.status(401).json({ error: error.message });
      }

      res.send("Login successful");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}
