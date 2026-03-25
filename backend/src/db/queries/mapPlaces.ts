/**
 * ───────────────────────────────────────────────────────────────
 * Database query functions for the dynamic map search.
 *
 * WHY THIS FILE EXISTS:
 *   Your existing placeData.ts queries places by radius from a
 *   single lat/lon point. For map pan, we need a different shape:
 *   a RECTANGLE (bounding box). This file provides that query,
 *   plus optional vibe tag filtering.
 *
 * THE TABLE it queries:
 *   places(place_id, place_name, location GEOGRAPHY, vibes TEXT[], osm_id, ...)
 *   — the updated schema from your dynamic_database_queries.txt
 *
 * PERFORMANCE:
 *   Uses the spatial index idx_places_location (GIST) for the
 *   bbox filter and idx_place_vibes (GIN) for the vibes filter.
 *   Both indexes are already in your schema — no extra setup needed.
 * ───────────────────────────────────────────────────────────────
 */

import { pool } from "../db.js";
import type { BBox } from "../../types/bbox.js";
import type { VibeTag } from "../../types/vibe.js";

export interface MapPlace {
  id: number | string;
  name: string;
  latitude: number;
  longitude: number;
  vibes: string[];
  source: string;
}

export async function getPlacesInBBox(
  bbox: BBox,
  tags: VibeTag[] = []
): Promise<MapPlace[]> {
  const { south, west, north, east } = bbox;

  // FIX: use ST_MakeEnvelope purely as geometry (no geography cast on the envelope)
  // and cast location to geometry for comparison - consistent types throughout
  let query: string;
  let params: unknown[];

  if (tags.length === 0) {
    query = `
      SELECT
        place_id                          AS id,
        place_name                        AS name,
        ST_Y(location::geometry)          AS latitude,
        ST_X(location::geometry)          AS longitude,
        COALESCE(vibes, '{}')             AS vibes,
        COALESCE(source, 'db')            AS source
      FROM places
      WHERE location::geometry && ST_MakeEnvelope($1, $2, $3, $4, 4326)
      ORDER BY place_name
      LIMIT 500
    `;
    params = [west, south, east, north];
  } else {
    query = `
      SELECT
        place_id                          AS id,
        place_name                        AS name,
        ST_Y(location::geometry)          AS latitude,
        ST_X(location::geometry)          AS longitude,
        COALESCE(vibes, '{}')             AS vibes,
        COALESCE(source, 'db')            AS source
      FROM places
      WHERE location::geometry && ST_MakeEnvelope($1, $2, $3, $4, 4326)
        AND vibes && $5::text[]
      ORDER BY place_name
      LIMIT 500
    `;
    params = [west, south, east, north, tags];
  }

  const result = await pool.query(query, params);
  return result.rows;
}