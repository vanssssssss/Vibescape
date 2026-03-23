import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../interfaces/jwt.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export const verifyToken = (req: AuthRequest,res: Response,next: NextFunction) => {
  const authHeader = req.headers.authorization ;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET_KEY) {
    throw new Error("JWT secret not defined");
    }

  try {
    
    const decoded = jwt.verify(
      token as string,
      process.env.JWT_SECRET_KEY
    ) as JwtPayload;

    if(!decoded.id){
      throw new Error("id is not decoded");
    }
    req.user = {
      id: decoded.id
    };

    console.log("middleware check done");

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};