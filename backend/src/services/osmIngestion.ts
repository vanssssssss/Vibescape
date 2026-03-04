/**
 * ───────────────────────────────────────────────────────────────
 * Fetches raw POIs from the Overpass API (OpenStreetMap) for a
 * given bounding box, then upserts them into the `places` table
 * in Supabase.
 *
 * WHY THIS FILE EXISTS:
 *   When a user pans the map to an area we haven't seen before,
 *   the backend calls fetchAndStoreOSMPlaces(bbox).
 *   This pulls ALL relevant OSM nodes/ways in that box and
 *   writes them to the DB so future requests are instant.
 * ───────────────────────────────────────────────────────────────
 */

import { pool } from "../db/db.js";
import { assignVibesFromOSMTags } from "./vibeEnricher.js";
import type { BBox } from "../types/bbox.js";

// ── Overpass query template ──────────────────────────────────
// We request nodes that are cafes, restaurants, parks, monuments,
// tourist attractions, or fast food — the OSM amenity/tourism keys
// that map best to your vibe tags.
function buildOverpassQuery(bbox: BBox): string {
  const { south, west, north, east } = bbox;
  const boxStr = `${south},${west},${north},${east}`;

  return `
    [out:json][timeout:30];
    (
      node["amenity"~"cafe|restaurant|fast_food|bar|food_court|marketplace"](${boxStr});
      node["tourism"~"attraction|museum|viewpoint|artwork"](${boxStr});
      node["leisure"~"park|garden|nature_reserve"](${boxStr});
      node["historic"~"monument|memorial|fort|palace|ruins|temple"](${boxStr});
      node["shop"~"bakery|confectionery"](${boxStr});
    );
    out body;
  `.trim();
}

// ── Raw OSM element type ──────────────────────────────────────
interface OSMElement {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OSMElement[];
}

// ── Main export ───────────────────────────────────────────────
/**
 * Fetches OSM POIs for a bbox, enriches with vibes, upserts to DB.
 * Returns the count of new rows inserted.
 */
export async function fetchAndStoreOSMPlaces(bbox: BBox): Promise<number> {
  const query = buildOverpassQuery(bbox);

  // 1. Hit Overpass API
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(35_000), // 35s hard timeout
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = (await response.json()) as OverpassResponse;
  const elements = data.elements ?? [];

  if (elements.length === 0) return 0;

  // 2. Filter: only named nodes
  const named = elements.filter(
    (el) => el.tags?.name && el.lat && el.lon
  );

  // 3. Upsert each place — ON CONFLICT (osm_id) DO UPDATE
  //    so re-ingesting the same area is safe and idempotent.
  let inserted = 0;

  // Batch in chunks of 100 to avoid giant single queries
  const CHUNK = 100;
  for (let i = 0; i < named.length; i += CHUNK) {
    const chunk = named.slice(i, i + CHUNK);

    // Build VALUES string for a multi-row upsert
    const values: unknown[] = [];
    const placeholders = chunk
      .map((el, idx) => {
        const base = idx * 6;
        const vibes = assignVibesFromOSMTags(el.tags ?? {});
        values.push(
          el.id,                   // $1 osm_id
          el.tags?.name ?? null,   // $2 name
          JSON.stringify(el.tags ?? {}), // $3 osm_tags
          vibes,                   // $4 vibes (text[])
          el.lon,                  // $5 longitude (for ST_MakePoint)
          el.lat                   // $6 latitude
        );
        return `($${base + 1}, $${base + 2}, $${base + 3}::jsonb, $${base + 4}::text[], ST_MakePoint($${base + 5}, $${base + 6})::geography, NOW(), 'osm')`;
      })
      .join(",\n");

    const sql = `
      INSERT INTO places (osm_id, place_name, osm_tags, vibes, location, last_updated, source)
      VALUES ${placeholders}
      ON CONFLICT (osm_id) DO UPDATE SET
        place_name   = EXCLUDED.place_name,
        osm_tags     = EXCLUDED.osm_tags,
        vibes        = EXCLUDED.vibes,
        last_updated = NOW()
    `;

    await pool.query(sql, values);
    inserted += chunk.length;
  }

  return inserted;
}