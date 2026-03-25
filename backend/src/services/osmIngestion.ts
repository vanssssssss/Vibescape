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

function buildOverpassQuery(bbox: BBox): string {
  const { south, west, north, east } = bbox;
  const boxStr = `${south},${west},${north},${east}`;

  // includes way + relation types so parks/forts mapped as polygons also return coords
  return `
    [out:json][timeout:45];
    (
      node["amenity"~"cafe|restaurant|fast_food|bar|food_court|marketplace"](${boxStr});
      way["amenity"~"cafe|restaurant|fast_food|bar|food_court|marketplace"](${boxStr});
      node["tourism"~"attraction|museum|viewpoint|artwork|hotel|guest_house"](${boxStr});
      way["tourism"~"attraction|museum|viewpoint|artwork|hotel|guest_house"](${boxStr});
      node["leisure"~"park|garden|nature_reserve|sports_centre"](${boxStr});
      way["leisure"~"park|garden|nature_reserve|sports_centre"](${boxStr});
      node["historic"~"monument|memorial|fort|palace|ruins|temple|shrine"](${boxStr});
      way["historic"~"monument|memorial|fort|palace|ruins|temple|shrine"](${boxStr});
      node["shop"~"bakery|confectionery|mall|supermarket"](${boxStr});
      way["shop"~"mall|supermarket"](${boxStr});
    );
    out center body;
  `.trim();
}

interface OSMElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OSMElement[];
}

export async function fetchAndStoreOSMPlaces(bbox: BBox): Promise<number> {
  const query = buildOverpassQuery(bbox);

  console.log(`[OSM] Fetching bbox: S=${bbox.south} W=${bbox.west} N=${bbox.north} E=${bbox.east}`);

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(50_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Overpass API ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as OverpassResponse;
  const elements = data.elements ?? [];
  console.log(`[OSM] Raw elements: ${elements.length}`);

  // accept both node (direct lat/lon) and way/relation (center coords)
  const named = elements.filter((el) => {
    const hasName = !!el.tags?.name;
    const hasCoords =
      (el.lat != null && el.lon != null) ||
      (el.center?.lat != null && el.center?.lon != null);
    return hasName && hasCoords;
  });

  console.log(`[OSM] Named with coords: ${named.length}`);
  if (named.length === 0) return 0;

  let inserted = 0;
  const CHUNK = 50;

  for (let i = 0; i < named.length; i += CHUNK) {
    const chunk = named.slice(i, i + CHUNK);
    const values: unknown[] = [];

    const placeholders = chunk
      .map((el, idx) => {
        const base = idx * 6;
        const vibes = assignVibesFromOSMTags(el.tags ?? {});
        const lat = el.lat ?? el.center!.lat;
        const lon = el.lon ?? el.center!.lon;
        values.push(el.id, el.tags?.name ?? null, JSON.stringify(el.tags ?? {}), vibes, lon, lat);
        return `($${base+1}, $${base+2}, $${base+3}::jsonb, $${base+4}::text[], ST_MakePoint($${base+5}, $${base+6})::geography, NOW(), 'osm')`;
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

    try {
      await pool.query(sql, values);
      inserted += chunk.length;
    } catch (err: any) {
      console.error(`[OSM] Batch failed (chunk ${i}): ${err.message}`);
      // fallback: insert one by one
      for (const el of chunk) {
        try {
          const lat = el.lat ?? el.center!.lat;
          const lon = el.lon ?? el.center!.lon;
          const vibes = assignVibesFromOSMTags(el.tags ?? {});
          await pool.query(
            `INSERT INTO places (osm_id, place_name, osm_tags, vibes, location, last_updated, source)
             VALUES ($1,$2,$3::jsonb,$4::text[],ST_MakePoint($5,$6)::geography,NOW(),'osm')
             ON CONFLICT (osm_id) DO UPDATE SET
               place_name=EXCLUDED.place_name, vibes=EXCLUDED.vibes, last_updated=NOW()`,
            [el.id, el.tags?.name, JSON.stringify(el.tags ?? {}), vibes, lon, lat]
          );
          inserted++;
        } catch (e2: any) {
          console.error(`[OSM] Single insert failed osm_id=${el.id}: ${e2.message}`);
        }
      }
    }
  }

  console.log(`[OSM] Upserted total: ${inserted}`);
  return inserted;
}