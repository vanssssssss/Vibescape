/**
 * ───────────────────────────────────────────────────────────────
 * Shared type for a geographic bounding box.
 * Used by the map pan event, OSM ingestion, and bbox cache.
 *
 *   south = min latitude  (bottom edge of the map view)
 *   north = max latitude  (top edge)
 *   west  = min longitude (left edge)
 *   east  = max longitude (right edge)
 * ───────────────────────────────────────────────────────────────
 */

export type BBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};