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

// ── Hash a bbox into a stable string key ─────────────────────
// Round to 2 decimal places so minor pans reuse the same cell.
export function hashBBox(bbox: BBox): string {
  const r = (n: number) => Math.round(n * 100) / 100; // 2 dp = ~1.1km
  return `${r(bbox.south)},${r(bbox.west)},${r(bbox.north)},${r(bbox.east)}`;
}

// ── Check if this bbox was already fetched from OSM ──────────
/**
 * Returns true if the bbox hash is in the cache and was
 * fetched less than 24 hours ago. Older entries are considered
 * stale and we re-fetch OSM to pick up new places.
 */
export async function isBBoxCached(bbox: BBox): Promise<boolean> {
  const hash = hashBBox(bbox);
  const result = await pool.query(
    `SELECT 1 FROM bbox_cache
     WHERE bbox_hash = $1
       AND last_seen > NOW() - INTERVAL '24 hours'
     LIMIT 1`,
    [hash]
  );
  return (result.rowCount ?? 0) > 0;
}

// ── Write (or refresh) a bbox cache entry ───────────────────
/**
 * After we've fetched OSM data for a bbox, call this to
 * record it in the cache so future pans skip the OSM call.
 */
export async function upsertBBoxCache(bbox: BBox): Promise<void> {
  const hash = hashBBox(bbox);
  await pool.query(
    `INSERT INTO bbox_cache (bbox_hash, last_seen)
     VALUES ($1, NOW())
     ON CONFLICT (bbox_hash) DO UPDATE SET last_seen = NOW()`,
    [hash]
  );
}

// ── Delete stale cache entries (optional cleanup) ────────────
// Call this from a scheduled job or on server startup.
export async function pruneOldBBoxCache(): Promise<void> {
  await pool.query(
    `DELETE FROM bbox_cache WHERE last_seen < NOW() - INTERVAL '7 days'`
  );
}