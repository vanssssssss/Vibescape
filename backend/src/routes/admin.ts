/**
 * src/routes/admin.ts
 * ─────────────────────────────────────────────────────────────────
 * Admin routes — all protected by verifyToken middleware.
 *
 * Mounted in app.ts at: /api/v1/admin
 *
 * POST /api/v1/admin/tags          → create one tag + back-link
 * POST /api/v1/admin/tags/bulk     → create many tags + back-link
 * POST /api/v1/admin/resync        → full consistency repair
 * POST /api/v1/admin/places        → insert a manual place with vibes[]
 * ─────────────────────────────────────────────────────────────────
 */

import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  createTag,
  createTagsBulk,
  triggerResync,
  createPlace,
} from "../controllers/admin.js";

const router = Router();

// All admin routes require a valid user JWT
router.use(verifyToken);

router.post("/tags", createTag);
router.post("/tags/bulk", createTagsBulk);
router.post("/resync", triggerResync);
router.post("/places", createPlace);

export default router;
