/**
 * ───────────────────────────────────────────────────────────────
 * Handles POST /api/v1/search/map
 *
 * This is the CORE controller for the dynamic database feature.
 * Every time the user pans the map, the frontend sends the new
 * bbox + optional vibe tags here. This controller:
 *
 *   1. Validates the incoming bbox
 *   2. Checks the bbox_cache — has this area been fetched before?
 *      YES → skip OSM, query our DB directly (FAST path)
 *      NO  → fetch from Overpass API, store in DB, update cache
 *            then query our DB (SLOW path, only happens once per area)
 *   3. Queries the places table filtered by bbox + vibe tags
 *   4. Returns enriched POIs to the frontend
 *
 * WHY POST not GET?
 *   A bbox has 4 floats + tags array — cleaner as a JSON body
 *   than a long query string. Also avoids URL length limits.
 * ───────────────────────────────────────────────────────────────
 */

import type { Request, Response } from "express";
import { isBBoxCached, upsertBBoxCache } from "../db/queries/bboxCache.js";
import { fetchAndStoreOSMPlaces } from "../services/osmIngestion.js";
import { getPlacesInBBox } from "../db/queries/mapPlaces.js";
import { parseVibe } from "../services/vibetag.js";
import type { BBox } from "../types/bbox.js";

// ── Jaipur metro bounding box (hard boundary for MVP) ────────
// Prevents the backend from fetching OSM data for other cities.
const JAIPUR_BBOX: BBox = {
  south: 26.75,
  west:  75.65,
  north: 27.10,
  east:  76.00,
};

function isInsideJaipur(bbox: BBox): boolean {
  return (
    bbox.south >= JAIPUR_BBOX.south &&
    bbox.west  >= JAIPUR_BBOX.west  &&
    bbox.north <= JAIPUR_BBOX.north &&
    bbox.east  <= JAIPUR_BBOX.east
  );
}

// ── Controller ───────────────────────────────────────────────
export const mapSearch = async (req: Request, res: Response) => {
  // ── 1. Parse + validate body ─────────────────────────────
  const { bbox, vibe } = req.body as {
    bbox?: { south?: number; west?: number; north?: number; east?: number };
    vibe?: string;
  };

  if (
    !bbox ||
    typeof bbox.south !== "number" ||
    typeof bbox.west  !== "number" ||
    typeof bbox.north !== "number" ||
    typeof bbox.east  !== "number"
  ) {
    return res.status(400).json({
      error: "bbox is required: { south, west, north, east }",
    });
  }

  const typedBBox: BBox = {
    south: bbox.south,
    west:  bbox.west,
    north: bbox.north,
    east:  bbox.east,
  };

  // ── 2. Enforce Jaipur-only MVP ────────────────────────────
  // Clamp the bbox to Jaipur metro instead of rejecting it,
  // so the user can pan slightly outside and still get results.
  const clampedBBox: BBox = {
    south: Math.max(typedBBox.south, JAIPUR_BBOX.south),
    west:  Math.max(typedBBox.west,  JAIPUR_BBOX.west),
    north: Math.min(typedBBox.north, JAIPUR_BBOX.north),
    east:  Math.min(typedBBox.east,  JAIPUR_BBOX.east),
  };

  // Parse vibe string → tags array using your existing parseVibe()
  const tags = vibe ? parseVibe(vibe) : [];

  // ── 3. Cache check ────────────────────────────────────────
  let cacheHit = false;
  let osmCount = 0;

  try {
    cacheHit = await isBBoxCached(clampedBBox);
  } catch (err) {
    // If cache check fails, treat as miss — better to re-fetch than crash
    console.error("bbox cache check failed, treating as miss:", err);
  }

  // ── 4. OSM fetch (slow path — only on cache miss) ─────────
  if (!cacheHit) {
    try {
      console.log(`[mapSearch] Cache MISS for bbox, fetching from OSM...`);
      osmCount = await fetchAndStoreOSMPlaces(clampedBBox);
      console.log(`[mapSearch] OSM upserted ${osmCount} places`);

      // Record in cache so this bbox is fast next time
      await upsertBBoxCache(clampedBBox);
    } catch (err) {
      // OSM is down / rate-limited → still serve whatever is in DB
      console.error("[mapSearch] OSM fetch failed, falling back to DB:", err);
    }
  } else {
    console.log(`[mapSearch] Cache HIT — serving from DB`);
  }

  // ── 5. Query our DB for places in this bbox ───────────────
  try {
    const places = await getPlacesInBBox(clampedBBox, tags);

    return res.status(200).json({
      source: cacheHit ? "db" : "osm+db",
      osmInserted: osmCount,
      count: places.length,
      places,
    });
  } catch (err) {
    console.error("[mapSearch] DB query failed:", err);
    return res.status(500).json({ error: "Failed to fetch places" });
  }
};