import type { Request, Response } from "express";
import {
  addToFavorites,
  markAsVisited,
  getFavoritesByUser,
  removeFavorite,
} from "../db/queries/favorites.js";

// POST /api/v1/favorites/add
// Body: { user_id, place_id, place_name, city }
// Adds place with status TO_VISIT
export const addFavorite = async (req: Request, res: Response) => {
  const { user_id, place_id, place_name, city } = req.body;

  if (!user_id || !place_id || !place_name) {
    return res.status(400).json({ error: "Missing required fields: user_id, place_id, place_name" });
  }

  try {
    const favorite = await addToFavorites(user_id, place_id, place_name, city || "");

    if (!favorite) {
      return res.status(409).json({ message: "Place already in favorites" });
    }

    return res.status(201).json({
      message: "Place added to favorites (To Visit)",
      favorite,
    });
  } catch (err: any) {
    console.error("addFavorite error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH /api/v1/favorites/visited
// Body: { user_id, place_id, place_name, city }
// Marks place as VISITED (inserts if not exists, updates if exists)
export const markVisited = async (req: Request, res: Response) => {
  const { user_id, place_id, place_name, city } = req.body;

  if (!user_id || !place_id || !place_name) {
    return res.status(400).json({ error: "Missing required fields: user_id, place_id, place_name" });
  }

  try {
    const favorite = await markAsVisited(user_id, place_id, place_name, city || "");

    return res.status(200).json({
      message: "Place marked as Visited",
      favorite,
    });
  } catch (err: any) {
    console.error("markVisited error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/v1/favorites/:user_id
// Query param: ?status=TO_VISIT | VISITED (optional)
export const getFavorites = async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const { status } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "Missing user_id" });
  }

  // Validate status if provided
  if (status && status !== "TO_VISIT" && status !== "VISITED") {
    return res.status(400).json({ error: "status must be TO_VISIT or VISITED" });
  }

  try {
    const favorites = await getFavoritesByUser(user_id, status as string | undefined);

    return res.status(200).json({ favorites });
  } catch (err: any) {
    console.error("getFavorites error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/v1/favorites/remove
// Body: { user_id, place_id }
export const deleteFavorite = async (req: Request, res: Response) => {
  const { user_id, place_id } = req.body;

  if (!user_id || !place_id) {
    return res.status(400).json({ error: "Missing required fields: user_id, place_id" });
  }

  try {
    const removed = await removeFavorite(user_id, place_id);

    if (!removed) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    return res.status(200).json({ message: "Favorite removed", favorite: removed });
  } catch (err: any) {
    console.error("deleteFavorite error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};