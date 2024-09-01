import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserAdmin, UserAdminType } from "../models/UserAdmin";

declare global {
  namespace Express {
    interface Request {
      adminUser?: UserAdminType;
    }
  }
}

export const adminAuthenticate = async (
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
      const user = await UserAdmin.findById(decoded.id).select("_id username email");
      if (!user) {
        const error = new Error("Invalid Token");
        return res.status(401).json({ error: error.message });
      }

      req.adminUser = user;
    }
  } catch (error) {
    return res.status(500).json({ error: "Invalid Token" });
  }

  next();
};
