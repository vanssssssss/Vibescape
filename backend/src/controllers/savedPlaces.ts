import type { Request, Response } from "express";
import {
  addToFavorites,
  markAsVisited,
  getFavoritesByUser,
  removeFavorite,
} from "../db/queries/favorites.js";
import { pool } from "../db/db.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

// // POST /api/v1/favorites/add
// // Body: { user_id, place_id, place_name, city }
// // Adds place with status TO_VISIT
// export const addFavorite = async (req: AuthRequest, res: Response) => {
//   const { place_id, place_name, city } = req.body;

//   if (!req.user) {
//     return res.status(401).json({ message: "Unauthorized" });
//   } 

//   const user_id = req.user.id;

//   if (!user_id || !place_id || !place_name) {
//     return res.status(400).json({ error: "Missing required fields: user_id, place_id, place_name" });
//   }

//   try {
//     const favorite = await addToFavorites(user_id, place_id, place_name, city || "");

//     if (!favorite) {
//       return res.status(409).json({ message: "Place already in favorites" });
//     }

//     return res.status(201).json({
//       message: "Place added to favorites (To Visit)",
//       favorite,
//     });
//   } catch (err: any) {
//     console.error("addFavorite error:", err.message);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// // PATCH /api/v1/favorites/visited
// // Body: { user_id, place_id, place_name, city }
// // Marks place as VISITED (inserts if not exists, updates if exists)
// export const markVisited = async (req: AuthRequest, res: Response) => {
//   const { place_id, place_name, city } = req.body;

//   if (!req.user) {
//     return res.status(401).json({ message: "Unauthorized" });
//   } 

//   const user_id = req.user.id;

//   if (!user_id || !place_id || !place_name) {
//     return res.status(400).json({ error: "Missing required fields: user_id, place_id, place_name" });
//   }

//   try {
//     const favorite = await markAsVisited(user_id, place_id, place_name, city || "");

//     return res.status(200).json({
//       message: "Place marked as Visited",
//       favorite,
//     });
//   } catch (err: any) {
//     console.error("markVisited error:", err.message);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// // GET /api/v1/favorites/:user_id
// // Query param: ?status=TO_VISIT | VISITED (optional)
// export const getFavorites = async (req: AuthRequest, res: Response) => {
//   const { status } = req.query;

//   if (!req.user) {
//     return res.status(401).json({ message: "Unauthorized" });
//   } 

//   const user_id = req.user.id;

//   if (!user_id) {
//     return res.status(400).json({ error: "Missing user_id" });
//   }

//   // Validate status if provided
//   if (status && status !== "TO_VISIT" && status !== "VISITED") {
//     return res.status(400).json({ error: "status must be TO_VISIT or VISITED" });
//   }

//   try {
//     const favorites = await getFavoritesByUser(user_id as string, status as string | undefined);

//     return res.status(200).json({ favorites });
//   } catch (err: any) {
//     console.error("getFavorites error:", err.message);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// // DELETE /api/v1/favorites/remove
// // Body: { user_id, place_id }
// export const deleteFavorite = async (req: AuthRequest, res: Response) => {
//   const { place_id } = req.body;

//   if (!req.user) {
//     return res.status(401).json({ message: "Unauthorized" });
//   } 

//   const user_id = req.user.id;

//   if (!user_id || !place_id) {
//     return res.status(400).json({ error: "Missing required fields: user_id, place_id" });
//   }

//   try {
//     const removed = await removeFavorite(user_id, place_id);

//     if (!removed) {
//       return res.status(404).json({ error: "Favorite not found" });
//     }

//     return res.status(200).json({ message: "Favorite removed", favorite: removed });
//   } catch (err: any) {
//     console.error("deleteFavorite error:", err.message);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

export const addToToBeVisted = async (req: AuthRequest, res: Response) => {

  const { place_id } = req.body;

  if (!place_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.user.id;

  try {
    const result = await pool.query(
      `
      INSERT INTO user_place
      (user_id, place_id, status)
      VALUES ($1, $2, 'TO_VISIT')

      ON CONFLICT (user_id, place_id)
      DO NOTHING

      RETURNING *;
      `,
      [userId, place_id]
    );

    if (result.rows.length > 0) {
      return res.status(201).json({
        message: "Place added to TO_VISIT",
        data: result.rows[0],
      });
    }

    const existing = await pool.query(
      `
      SELECT * FROM user_place
      WHERE user_id = $1 AND place_id = $2
      `,
      [userId, place_id]
    );

    const place = existing.rows[0];

    if (place.status === "VISITED") {
      return res.status(200).json({
        message: "Place already marked as VISITED",
        data: place,
      });
    }

    return res.status(200).json({
      message: "Place already in TO_VISIT",
      data: place,
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const markVisited = async (req: AuthRequest, res: Response) => {
  const { place_id } = req.body;

  if (!place_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.user.id;

  try {

    const existing = await pool.query(
      `SELECT status FROM user_place
       WHERE user_id = $1 AND place_id = $2`,
      [userId, place_id]
    );

    // already visited
    if (existing.rows.length > 0 && existing.rows[0].status === "VISITED") {
      return res.status(200).json({
        message: "Place already marked as VISITED",
        data: existing.rows[0],
      });
    }

    // insert or upgrade
    const result = await pool.query(
      `
      INSERT INTO user_place (user_id, place_id, status)
      VALUES ($1, $2, 'VISITED')
      ON CONFLICT (user_id, place_id)
      DO UPDATE SET status = 'VISITED'
      RETURNING *;
      `,
      [userId, place_id]
    );

    return res.status(200).json({
      message: existing.rows.length ? "Upgraded to VISITED" : "Marked as VISITED",
      data: result.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const toggleFavorites = async (req: AuthRequest, res: Response) => {
  const { place_id } = req.body;

  if (!place_id) {
    return res.status(400).json({ message: "place_id required" });
  }

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.user.id;

  try {
    const result = await pool.query(
      `
      UPDATE user_place
      SET favorite_at  = 
        CASE
          WHEN favorite_at IS NULL THEN NOW()
          ELSE NULL
        END
      WHERE user_id = $1
        AND place_id = $2
        AND status = 'VISITED'
      RETURNING *;
      `,
      [userId, place_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Place must be saved as VISITED to toggle favorite",
      });
    }

    return res.status(200).json({
      message: "Favorite toggled",
      data: result.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const getPlace = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { status, favorite } = req.query;
  const userId = req.user.id;

  if (
    status &&
    status !== "TO_VISIT" &&
    status !== "VISITED"
  ) {
    return res.status(400).json({
      message: "Invalid status",
    });
  }

  if (favorite && favorite !== "true" && favorite !== "false") {
    return res.status(400).json({ message: "Invalid favorite filter" });
  }

  try {
    let query = `SELECT * FROM user_place WHERE user_id = $1`;
    const params: any[] = [userId];
    let idx = 2;

    if (status) {
      query += ` AND status = $${idx++}`;
      params.push(status);
    }

    if (favorite === "true") {
      query += ` AND favorite_at IS NOT NULL`;
    }

    if (favorite === "false") {
      query += ` AND favorite_at IS NULL`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    return res.status(200).json({
      message: "Fetched places successfully",
      data: result.rows,
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const deletePlace = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.user.id;

  const { place_id } = req.params;

  if (!place_id) {
    return res.status(400).json({ message: "place_id required" });
  }

  try {
    const result = await pool.query(
      `
      DELETE FROM user_place
      WHERE user_id = $1
        AND place_id = $2
      RETURNING *;
      `,
      [userId, place_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Place not found",
      });
    }

    return res.status(200).json({
      message: "Place removed",
      data: result.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Internal server error" });
  }

}