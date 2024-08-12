import type { Request, Response } from "express";
import { UserAdmin } from "../models/UserAdmin";
import { hashPassword } from "../utils/auth";

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
      await user.save();
      res.send(
        "Account created successfully, check your email to verify your account"
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}
