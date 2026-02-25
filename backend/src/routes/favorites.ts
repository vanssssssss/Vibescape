import { Router } from "express";
import {
  addFavorite,
  markVisited,
  getFavorites,
  deleteFavorite,
} from "../controllers/favorites.js";

const router = Router();

// GET /api/v1/favorites/:user_id         → get all favorites (optional ?status=TO_VISIT|VISITED)
// POST /api/v1/favorites/add             → add to favorites (TO_VISIT)
// PATCH /api/v1/favorites/visited        → mark as visited
// DELETE /api/v1/favorites/remove        → remove from favorites

router.get("/:user_id", getFavorites);
router.post("/add", addFavorite);
router.patch("/visited", markVisited);
router.delete("/remove", deleteFavorite);

export default router;