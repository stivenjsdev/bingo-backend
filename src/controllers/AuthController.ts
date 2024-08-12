import type { Request, Response } from "express";
import { Token } from "../models/Token";
import { UserAdmin } from "../models/UserAdmin";
import { hashPassword } from "../utils/auth";
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
}
