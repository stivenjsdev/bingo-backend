import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User, UserType } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: UserType;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bearer = req.headers.authorization;

  if (!bearer) {
    const error = new Error("Unauthorized");
    return res.status(401).json({ error: error.message });
  }

  const [, token] = bearer.split(" ");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (typeof decoded === "object" && decoded.id) {
      const user = await User.findById(decoded.id)
        .select("_id name bingoCard game active")
        .populate({ path: "game", populate: { path: "winner", model: "User" } });
      if (!user) {
        const error = new Error("Invalid Token");
        return res.status(401).json({ error: error.message });
      }
      // validate if user is active
      if (!user.active) {
        const error = new Error("User is not active");
        return res.status(401).json({ error: error.message });
      }

      req.user = user;
    }
  } catch (error) {
    return res.status(500).json({ error: "Invalid Token" });
  }

  next();
};
