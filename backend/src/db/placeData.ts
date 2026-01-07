import type { Place } from "../types/place.js";
import { pool } from "./db.js";

export async function getAllPlaces() : Promise<Place[]> {
    const result = await pool.query(`
        SELECT
        p.place_id                  AS id,
        p.place_name                AS name,
        ST_Y(p.location::geometry)  AS latitude,
        ST_X(p.location::geometry)  AS longitude,
        COALESCE(
          array_agg(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL),
          '{}'
        ) AS tags
      FROM places p
      LEFT JOIN place_tag pt ON pt.place_id = p.place_id
      LEFT JOIN interest_tag t ON t.tag_id = pt.tag_id
      GROUP BY p.place_id  
    `);
    return result.rows;
}