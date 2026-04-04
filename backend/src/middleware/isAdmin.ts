import type { Request, Response, NextFunction } from "express";


interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required"
    });
  }

  next();
};
