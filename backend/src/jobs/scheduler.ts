/**
 * src/jobs/scheduler.ts
 * ───────────────────────────────────────────────────────────────
 * Runs OSM ingestion automatically in the background.
 * Called ONCE from server.ts on startup — no API, no frontend
 * trigger, no user action needed. Ever.
 *
 * SCHEDULE:
 *   - Server startup → ingest immediately (DB is never empty
 *     on first boot, like Zomato/Uber pre-filling their data)
 *   - Every 24 hours → re-ingest to pick up new OSM places
 *
 * WHY NODE-CRON (not Supabase Edge Functions, not pg_cron):
 *   - Supabase Edge Functions have cold starts + 150ms CPU limits
 *     → too slow for OSM ingestion (takes 5-30 seconds)
 *   - pg_cron requires a paid Supabase plan
 *   - node-cron runs inside your existing Express process,
 *     zero extra infrastructure, works on free tier
 *
 * ZERO-FAIL GUARANTEE:
 *   - All errors are caught and logged — scheduler NEVER crashes
 *     the server even if Overpass is down
 *   - ON CONFLICT in osmIngestion prevents duplicate rows
 *   - Even if ingestion fails, old data remains in DB (stale ≠ empty)
 * ───────────────────────────────────────────────────────────────
 */

import cron from "node-cron";
import { fetchAndStoreOSMPlaces } from "../services/osmIngestion.js";
import type { BBox } from "../types/bbox.js";

// ── Full Jaipur metro bounding box ────────────────────────────
// Covers everything: Amber Fort (north) → Sanganer (south)
// This is ingested in ONE shot — no panning needed ever again.
// const JAIPUR_BBOX: BBox = {
//   south: 26.75,
//   west:  75.65,
//   north: 27.10,
//   east:  76.00,
// };

const JAIPUR_TILES: BBox[] = [
  { south: 26.75, west: 75.65, north: 26.875, east: 75.825 }, // SW
  { south: 26.75, west: 75.825, north: 26.875, east: 76.0 }, // SE
  { south: 26.875, west: 75.65, north: 27.0, east: 75.825 }, // NW-bottom
  { south: 26.875, west: 75.825, north: 27.0, east: 76.0 }, // NE-bottom
  { south: 27.0, west: 75.65, north: 27.1, east: 75.825 }, // NW-top
  { south: 27.0, west: 75.825, north: 27.1, east: 76.0 }, // NE-top
];

// for (const tile of JAIPUR_TILES) {
//   await fetchAndStoreOSMPlaces(tile);
//   await new Promise(r => setTimeout(r, 2000)); // 2s gap between tiles
// }

// ── Internal runner ───────────────────────────────────────────
async function runIngestion(): Promise<void> {
  console.log("[Scheduler] Starting OSM ingestion for Jaipur metro...");
  try {
    let total = 0;

    for (const tile of JAIPUR_TILES) {
      const count = await fetchAndStoreOSMPlaces(tile);
      total += count;

      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log(`[Scheduler] Ingestion complete — ${total} places processed.`);
  } catch (err: any) {
    // NEVER let this crash the server — log and wait for next run
    console.error(
      `[Scheduler] Ingestion failed (will retry tomorrow): ${err.message}`,
    );
  }
}

// ── Main export — call this once from server.ts ───────────────
export function startScheduler(): void {
  // Run immediately on boot so the DB is populated from minute 1
  runIngestion();

  // Re-run every day at 3:00 AM to pick up new/changed OSM places
  // Cron format: second(opt) minute hour day month weekday
  cron.schedule("0 3 * * *", () => {
    console.log("[Scheduler] Daily 3AM refresh triggered.");
    runIngestion();
  });

  console.log(
    "[Scheduler] Cron registered — next auto-refresh at 3:00 AM daily.",
  );
}
