import type { Response, Request } from "express";
import imagekit from "../config/imagekit.js";
import { pool } from "../db/db.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export const createMemory = async(req : AuthRequest,res : Response) =>{
    try {
    const { place_id, title, notes } = req.body;
    const userId = req.user!.id;

    if (!place_id) {
      return res.status(400).json({
        message: "place_id is required"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO memories (user_id, place_id, title, notes, photos)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        userId,
        place_id,
        title || null,
        notes || null,
        JSON.stringify([])   // empty images array
      ]
    );

    return res.status(201).json(result.rows[0]);

  } catch (error) {
    return res.status(500).json({
      message: "Failed to create memory"
    });
  }
}

export const getAllMemories = async(req : AuthRequest,res : Response) =>{
    try {
    const userId = req.user!.id;

    const result = await pool.query(
      `
      SELECT memory_id, place_id, title, notes, photos, created_at
      FROM memories
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch memories"
    });
  }
}

export const addImage = async(req : AuthRequest,res : Response) =>{
    try {
    const { memoryId } = req.params;
    const { image_url } = req.body;
    const userId = req.user!.id;

    if (!image_url) {
      return res.status(400).json({
        message: "image_url is required"
      });
    }

    const memory = await pool.query(
      `
      SELECT photos, user_id
      FROM memories
      WHERE memory_id = $1
      `,
      [memoryId]
    );

    if (memory.rowCount === 0) {
      return res.status(404).json({
        message: "Memory not found"
      });
    }

    if (memory.rows[0].user_id !== userId) {
      return res.status(403).json({
        message: "Forbidden"
      });
    }

    const currentPhotos = memory.rows[0].photos
      ? JSON.parse(memory.rows[0].photos)
      : [];

    currentPhotos.push(image_url);

    await pool.query(
      `
      UPDATE memories
      SET photos = $1
      WHERE memory_id = $2
      `,
      [JSON.stringify(currentPhotos), memoryId]
    );

    return res.status(200).json({
      message: "Image added successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to add image"
    });
  }
}

export const addNotes = async(req : AuthRequest,res : Response) => {
    try {
    const { memoryId } = req.params;
    const { notes, title } = req.body;
    const userId = req.user!.id;

    const memory = await pool.query(
      `
      SELECT user_id
      FROM memories
      WHERE memory_id = $1
      `,
      [memoryId]
    );

    if (memory.rowCount === 0) {
      return res.status(404).json({
        message: "Memory not found"
      });
    }

    if (memory.rows[0].user_id !== userId) {
      return res.status(403).json({
        message: "Forbidden"
      });
    }

    const result = await pool.query(
      `
      UPDATE memories
      SET notes = COALESCE($1, notes),
          title = COALESCE($2, title),
          updated_at = NOW()
      WHERE memory_id = $3
      RETURNING *
      `,
      [notes || null, title || null, memoryId]
    );

    return res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update memory"
    });
  }
}

export const imagekitAuth = (req: Request, res: Response) => {
  const authParams = imagekit.getAuthenticationParameters();
  res.json(authParams);
};