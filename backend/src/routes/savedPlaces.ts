import { Router } from "express";
// import {
//   addFavorite,
//   markVisited,
//   getFavorites,
//   deleteFavorite,
// } from "../controllers/favorites.js";
import {
  addToToBeVisted,
  markVisited,
  toggleFavorites,
  getPlace,
  deletePlace,
} from "../controllers/savedPlaces.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// GET /api/v1/favorites/:user_id         → get all favorites (optional ?status=TO_VISIT|VISITED)
// POST /api/v1/favorites/add             → add to favorites (TO_VISIT)
// PATCH /api/v1/favorites/visited        → mark as visited
// DELETE /api/v1/favorites/remove        → remove from favorites

// router.get("/", verifyToken, getFavorites);
// router.post("/add", verifyToken, addFavorite);
// router.patch("/visited",verifyToken, markVisited);
// router.delete("/remove",verifyToken, deleteFavorite);

router.route("/").post(verifyToken, addToToBeVisted);
router.route("/visited").patch(verifyToken, markVisited);
router.route("/favorites").patch(verifyToken, toggleFavorites);
router.route("/:place_id").delete(verifyToken, deletePlace);
router.route("/").get(verifyToken, getPlace);

export default router;
