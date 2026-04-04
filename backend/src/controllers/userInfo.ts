import type { Response, Request } from "express";
import { pool } from "../db/db.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}


export const getUserInfo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

    const user = await pool.query(
      `SELECT name,email, profile_picture FROM users WHERE user_id = $1`,
      [userId],
    );

    if (user.rowCount == 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({
        message: "User fetched successfully",
        user_id: userId,
        email: user.rows[0].email,
        nickname: user.rows[0].name,
        profile_pic: user.rows[0].profile_picture || null,
      });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateName = async (req: AuthRequest, res: Response) => {
  let { nickname } = req.body;

  if (!nickname || typeof nickname !== "string") {
    return res.status(400).json({ message: "Invalid nickname" });
  }

  nickname = nickname.trim();

  if (nickname.length < 2 || nickname.length > 30) {
    return res.status(400).json({ message: "Nickname must be 2–30 chars" });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

    const user = await pool.query(
      `UPDATE users SET name = $1 WHERE user_id = $2 returning email,name,profile_picture`,
      [nickname, userId],
    );

    if (user.rowCount == 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({
        message: "Your nickname is updated",
        user_id: userId,
        email: user.rows[0].email,
        nickname: user.rows[0].name,
        profile_pic: user.rows[0].profile_picture || null,
      });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateProfilePic = async (req: AuthRequest, res: Response) => {
  try {
    const { profile_pic } = req.body;

    if (!profile_pic) {
      return res.status(400).json({
        message: "profile picture is required",
      });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

    const user = await pool.query(
      `UPDATE users SET profile_picture = $1 WHERE user_id = $2 returning email,name,profile_picture`,
      [profile_pic, userId],
    );

    if (user.rowCount == 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({
        message: "Profile pic updated",
        user_id: userId,
        email: user.rows[0].email,
        nickname: user.rows[0].name,
        profile_pic: user.rows[0].profile_picture || null,
      });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

    const user = await pool.query(
      `DELETE FROM users WHERE user_id = $1 RETURNING user_id`,
      [userId],
    );

    if (user.rowCount == 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error" });
  }
};
