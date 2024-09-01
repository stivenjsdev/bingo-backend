import type { Request, Response } from "express";
import { Token } from "../models/Token";
import { User } from "../models/User";
import { UserAdmin } from "../models/UserAdmin";
import { comparePassword, hashPassword } from "../utils/auth";
import { generateJWT } from "../utils/jwt";
import { generateToken } from "../utils/token";

export class AuthController {
  static adminCreateAccount = async (req: Request, res: Response) => {
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

  static adminLogin = async (req: Request, res: Response) => {
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

      // Generate a jwt
      const token = generateJWT({ id: user.id });

      res.send(token);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  static adminUser = async (req: Request, res: Response) => {
    return res.json(req.adminUser);
  };

  static login = async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      
      // Check if user exists
      const user = await User.findOne({ code });
      
      if (!user) {
        const error = new Error("User not found OR invalid code");
        return res.status(404).json({ error: error.message });
      }

      // Generate a jwt
      const token = generateJWT({ id: user.id });

      res.json({token});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  static user = async (req: Request, res: Response) => {
    return res.json(req.user);
  };

  static createPlayer = async (req: Request, res: Response) => {
    try {
      const { name, wpNumber } = req.body;

      // Check if user already exists
      const userExists = await User.findOne({ wpNumber });

      if (userExists) {
        const error = new Error("User already exists");
        return res.status(409).json({ error: error.message });
      }

      // Create a User
      function generateRandomFourDigitNumber() {
        return Math.floor(10000 + Math.random() * 90000);
      }
      const userData = {
        name,
        wpNumber,
        code:  name.substring(0, 3).toLowerCase() + generateRandomFourDigitNumber(),
        bingoCard: [],
        active: true,
      }
      const user = new User(userData);

      // Hash code // TODO: Implement this
      // user.password = await hashPassword(password);

      await user.save();

      res.send("Player created successfully");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}
