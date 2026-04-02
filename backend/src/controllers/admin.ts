/**
 * src/controllers/admin.ts
 * ─────────────────────────────────────────────────────────────────
 * Admin-only endpoints for tag management and data sync.
 * All routes in this controller are protected by verifyToken.
 *
 * Routes (registered in routes/admin.ts):
 *   POST   /api/v1/admin/tags          → insert one tag + back-link
 *   POST   /api/v1/admin/tags/bulk     → insert many tags + back-link
 *   POST   /api/v1/admin/resync        → full place↔tag consistency repair
 *   POST   /api/v1/admin/places        → insert a manual place with vibes[]
 * ─────────────────────────────────────────────────────────────────
 */

import type { Request, Response } from "express";
import {
  insertTagAndBacklink,
  bulkInsertTags,
  fullResync,
  insertPlaceWithVibes,
} from "../services/placeTagSync.js";

// ── POST /api/v1/admin/tags ───────────────────────────────────────
// Body: { tag_name: string }
// Inserts one tag and links it to all places whose vibes[] already
// contain that tag name.
export const createTag = async (req: Request, res: Response) => {
  const { tag_name } = req.body as { tag_name?: string };

  if (!tag_name?.trim()) {
    return res.status(400).json({ error: "tag_name is required" });
  }

  try {
    const tagId = await insertTagAndBacklink(tag_name);
    return res
      .status(201)
      .json({ tag_id: tagId, tag_name: tag_name.trim().toLowerCase() });
  } catch (err: any) {
    console.error("createTag error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── POST /api/v1/admin/tags/bulk ─────────────────────────────────
// Body: { tags: string[] }
// Inserts many tags in a single transaction and back-links each one.
// Useful for running the Tag Expansion Migration from the API.
export const createTagsBulk = async (req: Request, res: Response) => {
  const { tags } = req.body as { tags?: unknown };

  if (!Array.isArray(tags) || tags.length === 0) {
    return res
      .status(400)
      .json({ error: "tags must be a non-empty array of strings" });
  }

  // Validate all elements are strings
  const invalid = tags.filter((t) => typeof t !== "string" || !t.trim());
  if (invalid.length > 0) {
    return res
      .status(400)
      .json({ error: "All tags must be non-empty strings" });
  }

  try {
    const result = await bulkInsertTags(tags as string[]);
    return res.status(201).json(result);
  } catch (err: any) {
    console.error("createTagsBulk error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── POST /api/v1/admin/resync ─────────────────────────────────────
// Body: { chunk_size?: number }  (optional, defaults to 500)
// Triggers a full place↔tag consistency repair in the DB.
// Idempotent — safe to run at any time.
export const triggerResync = async (req: Request, res: Response) => {
  const chunkSize = Number(req.body?.chunk_size) || 500;

  try {
    const report = await fullResync(chunkSize);
    return res.status(200).json({ success: true, report });
  } catch (err: any) {
    console.error("triggerResync error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── POST /api/v1/admin/places ─────────────────────────────────────
// Body: { place_name, address, lat, lon, vibes: string[] }
// Inserts a manual place and populates place_tag from vibes[].
// Use this whenever adding places that didn't come from OSM.
export const createPlace = async (req: Request, res: Response) => {
  const { place_name, address, lat, lon, vibes } = req.body as {
    place_name?: string;
    address?: string;
    lat?: number;
    lon?: number;
    vibes?: unknown;
  };

  if (!place_name?.trim()) {
    return res.status(400).json({ error: "place_name is required" });
  }
  if (typeof lat !== "number" || typeof lon !== "number") {
    return res.status(400).json({ error: "lat and lon must be numbers" });
  }
  if (!Array.isArray(vibes)) {
    return res.status(400).json({ error: "vibes must be an array of strings" });
  }

  try {
    const placeId = await insertPlaceWithVibes({
      place_name: place_name.trim(),
      address: address?.trim() ?? "Jaipur",
      lat,
      lon,
      vibes: vibes as string[],
      source: "manual",
    });

    return res.status(201).json({ place_id: placeId });
  } catch (err: any) {
    console.error("createPlace error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
