import type { Request, Response } from "express";
import { pool } from "../db/db.js";

/**
 * GET /api/location/nearby
 * Query params: lat, lng, radius (metres, default 500)
 *
 * Returns up to 10 places within `radius` metres of the coordinates.
 * Uses PostGIS ST_DWithin on the `places` table.
 */
export const getNearbyPlaces = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    lat,
    lng,
    radius = "500",
  } = req.query as {
    lat?: string;
    lng?: string;
    radius?: string;
  };

  if (!lat || !lng) {
    res.status(400).json({ error: "lat and lng required" });
    return;
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const radiusNum = parseFloat(radius);

  if (isNaN(latNum) || isNaN(lngNum) || isNaN(radiusNum)) {
    res
      .status(400)
      .json({ error: "lat, lng and radius must be valid numbers" });
    return;
  }

  try {
    // NOTE: ST_MakePoint takes (longitude, latitude) — so lng goes first
    const result = await pool.query(
      `
      SELECT
        place_id,
        place_name,
        ST_Distance(location, ST_MakePoint($1,$2)::geography) AS distance_m
      FROM places
      WHERE ST_DWithin(location, ST_MakePoint($1,$2)::geography, $3)
      ORDER BY distance_m
      LIMIT 10
      `,
      [lngNum, latNum, radiusNum],
    );

    res.json({ places: result.rows });
  } catch (error) {
    console.error("[getNearbyPlaces] DB error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /api/location/geocode
 * Body: { query: string }
 *
 * Converts a text location to lat/lng via Nominatim (no API key required).
 * Uses native fetch (Node 18+) — no axios dependency needed.
 */
export const geocodeLocation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { query } = req.body as { query?: string };

  if (!query) {
    res.status(400).json({ error: "Location query is required" });
    return;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query,
    )}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: { "User-Agent": "VibeScape/1.0" },
    });

    if (!response.ok) {
      res.status(502).json({ error: "Nominatim request failed" });
      return;
    }

    const data = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    const first = data[0];

    if (!first) {
      res.status(404).json({ error: "Location not found" });
      return;
    }

    res.json({
      lat: first.lat,
      lng: first.lon,
      displayName: first.display_name,
    });
  } catch (error) {
    console.error("[geocodeLocation] Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
