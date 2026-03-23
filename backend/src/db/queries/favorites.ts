import { pool } from "../db.js";

// Add a place to favorites with TO_VISIT status
export async function addToFavorites(
  userId: string,
  placeId: string,
  placeName: string,
  city: string
) {
  const result = await pool.query(
    `INSERT INTO favorites (user_id, place_id, place_name, city, status)
     VALUES ($1, $2, $3, $4, 'TO_VISIT')
     ON CONFLICT (user_id, place_id) DO NOTHING
     RETURNING *`,
    [userId, placeId, placeName, city]
  );
  return result.rows[0] || null;
}

// Mark a place as visited (upserts or updates status)
export async function markAsVisited(
  userId: string,
  placeId: string,
  placeName: string,
  city: string
) {
  const result = await pool.query(
    `INSERT INTO favorites (user_id, place_id, place_name, city, status)
     VALUES ($1, $2, $3, $4, 'VISITED')
     ON CONFLICT (user_id, place_id) DO UPDATE SET status = 'VISITED'
     RETURNING *`,
    [userId, placeId, placeName, city]
  );
  return result.rows[0] || null;
}

// Get all favorites for a user, optionally filtered by status
export async function getFavoritesByUser(userId: string, status?: string) {
  let query = `SELECT * FROM favorites WHERE user_id = $1`;
  const params: any[] = [userId];

  if (status) {
    query += ` AND status = $2`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
}

// Remove a place from favorites
export async function removeFavorite(userId: string, placeId: string) {
  const result = await pool.query(
    `DELETE FROM favorites WHERE user_id = $1 AND place_id = $2 RETURNING *`,
    [userId, placeId]
  );
  return result.rows[0] || null;
}