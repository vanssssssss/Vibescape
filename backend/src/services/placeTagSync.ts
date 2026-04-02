/**
 * src/services/placeTagSync.ts
 * ─────────────────────────────────────────────────────────────────
 * Central service for every write that touches places or interest_tag.
 *
 * WHY THIS FILE EXISTS:
 *   When a place is inserted with vibes[], or a new tag is inserted,
 *   the DB alone cannot safely maintain both directions of the sync
 *   without trigger circular-fire risk. This service:
 *     - Inserts the row in a transaction
 *     - Calls the matching DB function (fn_vibes_to_place_tag or
 *       fn_tag_to_places) to propagate the change
 *   keeping all orchestration logic in one auditable place.
 *
 * RULES:
 *   - Never INSERT into places directly from a controller.
 *     Always call insertPlaceWithVibes() here.
 *   - Never INSERT into interest_tag directly from a controller.
 *     Always call insertTagAndBacklink() here.
 *   - OSM ingestion is the only exception — it upserts in bulk via
 *     batchUpsertPlaces() in osmIngestion.ts and calls fullResync()
 *     at the end of each run.
 * ─────────────────────────────────────────────────────────────────
 */

import { pool } from "../db/db.js";

// ── Types ─────────────────────────────────────────────────────────

export interface InsertPlaceParams {
  place_name: string;
  address: string;
  lon: number;
  lat: number;
  vibes: string[];
  source?: string;
  osm_id?: number;
}

export interface BulkTagResult {
  inserted: number;
  linked: number;
}

export interface ResyncReport {
  total_places: number;
  place_tag_inserted: number;
  vibes_updated: number;
}

// ── 1. Insert a place and populate place_tag from vibes[] ─────────
export async function insertPlaceWithVibes(
  params: InsertPlaceParams,
): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1a. Insert the place row
    const insertResult = await client.query<{ place_id: number }>(
      `INSERT INTO places
         (place_name, address, location, vibes, source, osm_id)
       VALUES
         ($1, $2, ST_MakePoint($3, $4)::geography, $5::text[], $6, $7)
       RETURNING place_id`,
      [
        params.place_name,
        params.address,
        params.lon,
        params.lat,
        params.vibes,
        params.source ?? "manual",
        params.osm_id ?? null,
      ],
    );

    const placeId = insertResult.rows[0]!.place_id;

    // 1b. Populate place_tag rows from the vibes[] we just stored
    const syncResult = await client.query<{ fn_vibes_to_place_tag: number }>(
      "SELECT fn_vibes_to_place_tag($1)",
      [placeId],
    );

    const synced = syncResult.rows[0]?.fn_vibes_to_place_tag ?? 0;
    console.log(
      `[placeTagSync] Inserted place_id=${placeId} ` +
        `"${params.place_name}" — synced ${synced} tag(s)`,
    );

    await client.query("COMMIT");
    return placeId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ── 2. Insert a single tag and back-link to existing places ───────
export async function insertTagAndBacklink(tagName: string): Promise<number> {
  const normalised = tagName.trim().toLowerCase().replace(/\s+/g, "_");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 2a. Insert the tag (ON CONFLICT returns existing id without error)
    const tagResult = await client.query<{ tag_id: number }>(
      `INSERT INTO interest_tag (tag_name)
       VALUES ($1)
       ON CONFLICT (tag_name) DO UPDATE SET tag_name = EXCLUDED.tag_name
       RETURNING tag_id`,
      [normalised],
    );

    const tagId = tagResult.rows[0]!.tag_id;

    // 2b. Link to all places whose vibes[] already contains this name
    const syncResult = await client.query<{ fn_tag_to_places: number }>(
      "SELECT fn_tag_to_places($1)",
      [tagId],
    );

    const linked = syncResult.rows[0]?.fn_tag_to_places ?? 0;
    console.log(
      `[placeTagSync] Inserted/found tag_id=${tagId} ` +
        `"${normalised}" — linked to ${linked} place(s)`,
    );

    await client.query("COMMIT");
    return tagId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ── 3. Bulk insert tags (e.g. admin tag expansion) ────────────────
export async function bulkInsertTags(
  tagNames: string[],
): Promise<BulkTagResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let totalLinked = 0;
    let totalInserted = 0;

    for (const rawName of tagNames) {
      const normalised = rawName.trim().toLowerCase().replace(/\s+/g, "_");

      // Insert only — skip existing tags
      const tagResult = await client.query<{ tag_id: number }>(
        `INSERT INTO interest_tag (tag_name)
         VALUES ($1)
         ON CONFLICT (tag_name) DO NOTHING
         RETURNING tag_id`,
        [normalised],
      );

      // rows is empty if the tag already existed
      if (tagResult.rows.length === 0) {
        console.log(
          `[placeTagSync] Tag "${normalised}" already exists — skipped`,
        );
        continue;
      }

      const tagId = tagResult.rows[0]!.tag_id;
      totalInserted++;

      // Back-link to all matching places
      const syncResult = await client.query<{ fn_tag_to_places: number }>(
        "SELECT fn_tag_to_places($1)",
        [tagId],
      );

      const linked = syncResult.rows[0]?.fn_tag_to_places ?? 0;
      totalLinked += linked;

      console.log(
        `[placeTagSync] bulk: tag_id=${tagId} "${normalised}" ` +
          `linked to ${linked} place(s)`,
      );
    }

    await client.query("COMMIT");
    return { inserted: totalInserted, linked: totalLinked };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ── 4. Full resync (admin repair utility) ─────────────────────────
export async function fullResync(chunkSize = 500): Promise<ResyncReport> {
  console.log(`[placeTagSync] Starting fullResync (chunk=${chunkSize})...`);

  const result = await pool.query<{ report: ResyncReport }>(
    "SELECT resync_all_places($1) AS report",
    [chunkSize],
  );

  const report = result.rows[0]!.report;
  console.log(
    `[placeTagSync] fullResync done — ` +
      `places=${report.total_places}, ` +
      `place_tag inserted=${report.place_tag_inserted}, ` +
      `vibes updated=${report.vibes_updated}`,
  );
  return report;
}
