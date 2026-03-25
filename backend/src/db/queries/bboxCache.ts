/**
 * ───────────────────────────────────────────────────────────────
 * Database query functions for the bbox_cache table.
 *
 * WHY THIS FILE EXISTS:
 *   Every time a user pans the map, we get a bbox (bounding box).
 *   We don't want to hit Overpass API every single time — that's
 *   slow and rate-limited. So we store which bboxes we've already
 *   fetched OSM data for. If a bbox is already in the cache,
 *   we skip the OSM fetch and just query our own DB.
 *
 * THE TABLE (already in your SQL schema):
 *   bbox_cache(id, bbox_hash TEXT UNIQUE, place_ids BIGINT[], last_seen TIMESTAMP)
 *
 * HOW BBOX HASHING WORKS:
 *   We round bbox coords to 2 decimal places (~1km grid), then
 *   hash the string. This means nearby overlapping areas share
 *   cache cells. A pan of 50m doesn't create a new cache entry.
 * ───────────────────────────────────────────────────────────────
 */

import { pool } from "../db.js";
import type { BBox } from "../../types/bbox.js";

// FIX: round to 1 decimal place (~11km grid) instead of 2 (~1km)
// At 2dp, every slight pan created a new cache key and OSM was always re-fetched.
// At 1dp, the entire Jaipur central view maps to the same cache cell.
export function hashBBox(bbox: BBox): string {
  const r = (n: number) => Math.round(n * 10) / 10;
  return `${r(bbox.south)},${r(bbox.west)},${r(bbox.north)},${r(bbox.east)}`;
}

export async function isBBoxCached(bbox: BBox): Promise<boolean> {
  const hash = hashBBox(bbox);
  console.log(`[BBoxCache] Checking hash: ${hash}`);
  const result = await pool.query(
    `SELECT 1 FROM bbox_cache
     WHERE bbox_hash = $1
       AND last_seen > NOW() - INTERVAL '24 hours'
     LIMIT 1`,
    [hash]
  );
  const hit = (result.rowCount ?? 0) > 0;
  console.log(`[BBoxCache] ${hit ? "HIT" : "MISS"} for ${hash}`);
  return hit;
}

export async function upsertBBoxCache(bbox: BBox): Promise<void> {
  const hash = hashBBox(bbox);
  await pool.query(
    `INSERT INTO bbox_cache (bbox_hash, last_seen)
     VALUES ($1, NOW())
     ON CONFLICT (bbox_hash) DO UPDATE SET last_seen = NOW()`,
    [hash]
  );
  console.log(`[BBoxCache] Cached: ${hash}`);
}

export async function pruneOldBBoxCache(): Promise<void> {
  await pool.query(
    `DELETE FROM bbox_cache WHERE last_seen < NOW() - INTERVAL '7 days'`
  );
}