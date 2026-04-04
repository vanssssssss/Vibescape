import type { Request,Response } from "express";
import { pool } from "../db/db.js";


interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {

    const users = await pool.query(
      `SELECT 
        user_id,
        name,
        email,
        created_at,
        is_verified,
        role
      FROM users
      ORDER BY created_at DESC`
    );

    return res.status(200).json(users.rows);

  } catch (err) {

    console.error("Fetch users error:", err);

    return res.status(500).json({
      message: "Server error"
    });

  }
}

export const promoteUserToAdmin = async (req: AuthRequest, res: Response) => {
  const userId = req.params.id;
  if(!userId){
    return res.status(404).json({
        message: "User id required"
      });
  }

  try {

    const user = await pool.query(
      `SELECT role FROM users WHERE user_id = $1`,
      [userId]
    );

    if (user.rowCount === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.rows[0].role === "admin") {
      return res.status(400).json({
        message: "User is already admin"
      });
    }

    await pool.query(
      `UPDATE users SET role = 'admin' WHERE user_id = $1`,
      [userId]
    );

    return res.status(200).json({
      message: "User promoted to admin"
    });

  } catch (err) {

    console.error("Promote user error:", err);

    return res.status(500).json({
      message: "Server error"
    });

  }
}

export const demoteAdminTouser = async (req: AuthRequest, res: Response) => {
    const userId = req.params.id;
    if(!userId){
    return res.status(404).json({
        message: "User id required"
      });
  }

  try {

    const user = await pool.query(
      `SELECT role FROM users WHERE user_id = $1`,
      [userId]
    );

    if (user.rowCount === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.rows[0].role !== "admin") {
      return res.status(400).json({
        message: "User is not an admin"
      });
    }

    const adminCount = await pool.query(
      `SELECT COUNT(*) FROM users WHERE role='admin'`
    );

    if (Number(adminCount.rows[0].count) === 1) {
      return res.status(400).json({
        message: "Cannot remove the last admin"
      });
    }

    await pool.query(
      `UPDATE users SET role='user' WHERE user_id=$1`,
      [userId]
    );

    return res.status(200).json({
      message: "Admin demoted to user"
    });

  } catch (err) {

    console.error("Demote user error:", err);

    return res.status(500).json({
      message: "Server error"
    });

  }
}

export const addInterestTag = async (req: AuthRequest, res: Response) => {
  const { tag_name, description } = req.body;

  if (!tag_name) {
    return res.status(400).json({
      message: "Tag name required"
    });
  }

  const normalizedTag = tag_name.trim().toLowerCase();

  try {

    const existingTag = await pool.query(
      `SELECT tag_id FROM interest_tag
       WHERE LOWER(tag_name) = LOWER($1)`,
      [normalizedTag]
    );

    if (existingTag.rowCount) {
      return res.status(409).json({
        message: "Tag already exists"
      });
    }

    const tag = await pool.query(
      `INSERT INTO interest_tag (tag_name, description)
       VALUES ($1,$2)
       RETURNING *`,
      [normalizedTag, description || null]
    );

    return res.status(201).json(tag.rows[0]);

  } catch (err) {

    console.error("Create tag error:", err);

    return res.status(500).json({
      message: "Server error"
    });

  }
}

export const deleteInterestTag = async (req: AuthRequest, res: Response) => {
  const tagId = req.params.id;

  if(!tagId){
    return res.status(404).json({
        message: "User id required"
      });
  }

  try {

    const tag = await pool.query(
      `SELECT tag_id FROM interest_tag WHERE tag_id=$1`,
      [tagId]
    );

    if (!tag.rowCount) {
      return res.status(404).json({
        message: "Tag not found"
      });
    }

    await pool.query(
      `DELETE FROM interest_tag WHERE tag_id=$1`,
      [tagId]
    );

    return res.status(200).json({
      message: "Tag deleted successfully"
    });

  } catch (err) {

    console.error("Delete tag error:", err);

    return res.status(500).json({
      message: "Server error"
    });

  }
}

export const getAllTags = async (req: AuthRequest, res: Response) => {
    try {

    const tags = await pool.query(
      `SELECT
         tag_id,
         tag_name,
         description,
         created_at
       FROM interest_tag
       ORDER BY created_at DESC`
    );

    return res.status(200).json(tags.rows);

  } catch (err) {

    console.error("Fetch tags error:", err);

    return res.status(500).json({
      message: "Server error"
    });

  }
}