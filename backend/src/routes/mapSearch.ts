/**
 * ───────────────────────────────────────────────────────────────
 * Registers the POST /api/v1/search/map endpoint.
 *
 * Separate from searchPlace route (GET /api/v1/search) so that
 * the old vibe-text search still works unchanged during migration.
 * ───────────────────────────────────────────────────────────────
 */

import { Router } from "express";
import { mapSearch } from "../controllers/mapSearch.js";

const router = Router();

// POST /api/v1/search/map
// Body: { bbox: { south, west, north, east }, vibe?: string }
router.post("/map", mapSearch);

export default router;