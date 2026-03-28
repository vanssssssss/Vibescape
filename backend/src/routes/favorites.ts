import { Router } from "express";
import {
  addFavorite,
  markVisited,
  getFavorites,
  deleteFavorite,
} from "../controllers/favorites.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// GET /api/v1/favorites/:user_id         → get all favorites (optional ?status=TO_VISIT|VISITED)
// POST /api/v1/favorites/add             → add to favorites (TO_VISIT)
// PATCH /api/v1/favorites/visited        → mark as visited
// DELETE /api/v1/favorites/remove        → remove from favorites

router.get("/", verifyToken, getFavorites);
router.post("/add", verifyToken, addFavorite);
router.patch("/visited",verifyToken, markVisited);
router.delete("/remove",verifyToken, deleteFavorite);

export default router;