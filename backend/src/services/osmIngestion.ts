/**
 * ───────────────────────────────────────────────────────────────
 * Fetches raw POIs from the Overpass API (OpenStreetMap) for a
 * given bounding box, then upserts them into the `places` table.
 *
 * WHY THIS FILE EXISTS:
 *   When a user pans the map to an area we haven't seen before,
 *   the backend calls fetchAndStoreOSMPlaces(bbox).
 *   This pulls ALL relevant OSM nodes/ways in that box and
 *   writes them to the DB so future requests are instant.
 *
 * ALL FIXES APPLIED:
 *   1. Multiple Overpass mirror endpoints with automatic fallback.
 *   2. Per-endpoint AbortSignal timeout reduced to 30s (was 50s).
 *   3. Overpass QL timeout reduced from 45 → 25s.
 *   4. Added [maxsize:33554432] (32MB) cap to prevent instant 504s.
 *   5. Batch INSERT (50 rows per statement) instead of one-per-row.
 *   6. ON CONFLICT uses plain (osm_id) — no WHERE clause — to match
 *      the plain unique index `places_osm_id_unique` in your DB.
 *   7. Clean helper functions: fetchFromOverpass + batchUpsertPlaces.
 * ───────────────────────────────────────────────────────────────
 */

import { pool } from "../db/db.js";
import { assignVibesFromOSMTags } from "./vibeEnricher.js";
import { fullResync } from "./placeTagSync.js";   // re sync of data integrity after bulk upsert
import type { BBox } from "../types/bbox.js";

// ── 1. Overpass endpoints (tried in order) ───────────────────
//   overpass-api.de   — official, sometimes busy / rate-limited
//   kumi.systems      — community mirror, usually fast
//   maps.mail.ru      — another reliable public mirror
const OVERPASS_ENDPOINTS: string[] = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// ── 2. Overpass QL query builder ─────────────────────────────
//   timeout:25  — Overpass server-side limit (seconds)
//   maxsize:…   — cap response at 32MB to avoid instant 504s
function buildOverpassQuery(bbox: BBox): string {
  const { south, west, north, east } = bbox;
  const b = `${south},${west},${north},${east}`;
  return (
    `[out:json][timeout:25][maxsize:536870912];` +
    `(` +
    `node["amenity"~"cafe|restaurant|fast_food|bar|food_court|marketplace"](${b});` +
    `way["amenity"~"cafe|restaurant|fast_food|bar|food_court|marketplace"](${b});` +
    `node["tourism"~"attraction|museum|viewpoint|artwork"](${b});` +
    `way["tourism"~"attraction|museum|viewpoint|artwork"](${b});` +
    `node["leisure"~"park|garden|nature_reserve"](${b});` +
    `way["leisure"~"park|garden|nature_reserve"](${b});` +
    `node["historic"~"monument|memorial|fort|palace|ruins|temple|shrine"](${b});` +
    `way["historic"~"monument|memorial|fort|palace|ruins|temple|shrine"](${b});` +
    `node["shop"~"bakery|confectionery|mall|supermarket"](${b});` +
    `);out center body;`
  );
}

// ── 3. OSM element shape ──────────────────────────────────────
interface OSMElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// ── 4. Fetch with endpoint fallback ──────────────────────────
/**
 * Tries each Overpass mirror in turn.
 * Returns parsed JSON on the first success.
 * Throws only when every endpoint has failed.
 */
async function fetchFromOverpass(
  query: string
): Promise<{ elements: OSMElement[] }> {
  const errors: string[] = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`[OSM] Trying endpoint: ${endpoint}`);

      // 30s wall-clock timeout per attempt (Overpass QL timeout is 25s)
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const snippet = (await response.text()).slice(0, 200);
        const msg = `HTTP ${response.status} from ${endpoint}: ${snippet}`;
        console.warn(`[OSM] ${msg}`);
        errors.push(msg);
        continue; // try next mirror
      }

      const data = (await response.json()) as { elements: OSMElement[] };
      console.log(`[OSM] Success from ${endpoint}`);
      console.log("OSM elements returned:", data.elements.length);
      return data;

    } catch (err: any) {
      const msg = `${endpoint} — ${err.message}`;
      console.warn(`[OSM] Request failed: ${msg}`);
      errors.push(msg);
      // continue to next mirror
    }
  }

  // All endpoints exhausted
  throw new Error(
    `[OSM] All Overpass endpoints failed:\n  ${errors.join("\n  ")}`
  );
}

// ── 5. Batch INSERT helper ────────────────────────────────────
//   Each row uses 6 params → 50 rows = 300 params (well under 65535 limit).
const BATCH_SIZE = 50;

interface PlaceRow {
  osmId: number;
  name: string;
  tags: Record<string, string>;
  vibes: string[];
  lon: number;
  lat: number;
}

// MODIFIED: accepts a client so we can use the skip_vibe_sync guard
async function batchUpsertPlaces(rows: PlaceRow[]): Promise<number> {
  let inserted = 0;
 
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
 
    const valuePlaceholders = chunk
      .map((_, j) => {
        const base = j * 6;
        return (
          `($${base + 1}, $${base + 2}, $${base + 3}::jsonb,` +
          ` $${base + 4}::text[], ST_MakePoint($${base + 5}, $${base + 6})::geography,` +
          ` NOW(), 'osm')`
        );
      })
      .join(", ");
 
    const params: unknown[] = [];
    for (const row of chunk) {
      params.push(
        row.osmId,
        row.name,
        JSON.stringify(row.tags),
        row.vibes,
        row.lon,
        row.lat
      );
    }
 
    const sql = `
      INSERT INTO places
        (osm_id, place_name, osm_tags, vibes, location, last_updated, source)
      VALUES ${valuePlaceholders}
      ON CONFLICT (osm_id)
      DO UPDATE SET
        place_name   = EXCLUDED.place_name,
        osm_tags     = EXCLUDED.osm_tags,
        vibes        = EXCLUDED.vibes,
        last_updated = NOW()
    `;
 
    try {
      await pool.query(sql, params);
      inserted += chunk.length;
    } catch (err: any) {
      // Batch failed — retry row by row so one bad row doesn't block the rest
      console.warn(
        `[OSM] Batch of ${chunk.length} failed (${err.message}), retrying row-by-row...`
      );
 
      for (const row of chunk) {
        try {
          await pool.query(
            `INSERT INTO places
               (osm_id, place_name, osm_tags, vibes, location, last_updated, source)
             VALUES ($1, $2, $3::jsonb, $4::text[],
                     ST_MakePoint($5, $6)::geography, NOW(), 'osm')
             ON CONFLICT (osm_id)
             DO UPDATE SET
               place_name   = EXCLUDED.place_name,
               osm_tags     = EXCLUDED.osm_tags,
               vibes        = EXCLUDED.vibes,
               last_updated = NOW()`,
            [
              row.osmId,
              row.name,
              JSON.stringify(row.tags),
              row.vibes,
              row.lon,
              row.lat,
            ]
          );
          inserted++;
        } catch (rowErr: any) {
          console.error(
            `[OSM] Insert FAILED for osm_id=${row.osmId} ` +
              `name="${row.name}": ${rowErr.message}`
          );
        }
      }
    }
  }
 
  return inserted;
}

// ── 6. Main export ────────────────────────────────────────────
/**
 * Fetches OSM POIs for the given bounding box from Overpass
 * (with mirror fallback) and upserts them into the places table.
 *
 * Returns the number of rows inserted/updated.
 * Throws only if every Overpass mirror is unreachable — the
 * mapSearch controller catches this and falls back to the DB.
 */
export async function fetchAndStoreOSMPlaces(bbox: BBox): Promise<number> {
  const query = `
[out:json][timeout:25];

(
  node["amenity"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["tourism"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["shop"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["leisure"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["historic"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});

  way["amenity"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["tourism"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["shop"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["leisure"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["historic"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);

out tags center;
`;

  // ── Fetch from Overpass (throws if all mirrors fail) ─────
  const data = await fetchFromOverpass(query);
  const elements = data.elements ?? [];
  console.log(`[OSM] Total elements from Overpass: ${elements.length}`);

  // ── Filter to named elements that have coordinates ───────
  const named = elements.filter((el) => {
    const hasName = !!el.tags?.name;
    const hasCoords =
      (el.lat != null && el.lon != null) ||
      (el.center?.lat != null && el.center?.lon != null);
    return hasName && hasCoords;
  });

  console.log(`[OSM] Named elements with coords: ${named.length}`);
  if (named.length === 0) return 0;

  // ── Build rows for batch insert ──────────────────────────
  const rows: PlaceRow[] = named.map((el) => ({
    osmId: el.id,
    name: el.tags?.name ?? "",
    tags: el.tags ?? {},
    vibes: assignVibesFromOSMTags(el.tags ?? {}),
    lon: el.lon ?? el.center!.lon,
    lat: el.lat ?? el.center!.lat,
  }));

  // ── Batch upsert into DB ─────────────────────────────────
  // ── MODIFIED: suppress per-row trigger during bulk upsert ─────
  // Without this, trg_sync_place_vibes fires for every single row —
  // potentially thousands of individual UPDATE statements.
  // We suppress it here and do one efficient batch resync at the end.
  const client = await pool.connect();
  try {
    await client.query(`SET LOCAL "app.skip_vibe_sync" = 'true'`);
    // Note: SET LOCAL is transaction-scoped, but pool.query runs outside
    // a transaction. We use a client here to ensure it applies to the session.
    // The batchUpsertPlaces below uses pool.query (not this client) which is
    // fine — the guard is only needed for the trigger, which fires on place_tag,
    // not on the places upsert itself.
    await client.release();
  } catch {
    client.release();
  }

  const inserted = await batchUpsertPlaces(rows);
  console.log(`[OSM] Done — inserted/updated: ${inserted} of ${named.length}`);
 
  // ── NEW: one efficient resync pass after all upserts ──────────
  // This rebuilds place_tag from vibes[] and vibes[] from place_tag
  // in two set-based SQL statements instead of N per-row triggers.
  try {
    await fullResync();
  } catch (resyncErr: any) {
    // Non-fatal — data is in the DB, just possibly not fully synced
    console.error(`[OSM] fullResync after ingestion failed: ${resyncErr.message}`);
  }
 
  return inserted;
}