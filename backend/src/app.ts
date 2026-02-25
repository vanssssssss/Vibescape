import express from "express";
<<<<<<< Updated upstream
import cors from "cors"; // import cors middleware
=======
import searchPlaceRouter from "./routes/searchPlace.js";
import authRouter from "./routes/auth.js";
import favoritesRouter from "./routes/favorites.js";
import cors from "cors";
import "dotenv/config";
>>>>>>> Stashed changes

const app = express();

app.use(cors());          // added CORS middleware
app.use(express.json());

<<<<<<< Updated upstream
export default app;
=======
app.use('/api/v1/search',searchPlaceRouter);
app.use('/api/v1/auth',authRouter);
app.use('/api/v1/favorites',favoritesRouter);
>>>>>>> Stashed changes

//temporary
/*app.get("/api/v1/search", (req, res) => {
  res.json({
    query: req.query.vibe,
    tags: [],
    places: []
  });
});
*/

//modification to integrate routes
import { pool } from "./db.js";

app.get("/api/v1/search", async (req, res) => {
  try {
    const vibe = req.query.vibe as string;
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const radius = Number(req.query.radius) || 2000;

    if (!vibe || isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }

    // 🔹 SIMPLE NLP (Phase-1)
    const KNOWN_TAGS = ["quiet", "cafe", "crowded", "FastFood"];
    const tags = KNOWN_TAGS.filter(tag =>
      vibe.toLowerCase().includes(tag.toLowerCase())
    );

    if (tags.length === 0) {
      return res.json({
        query: vibe,
        tags: [],
        places: [],
      });
    }

    // 🔹 PostgreSQL + PostGIS query
    const sql = `
      SELECT DISTINCT
        p.id,
        p.name,
        p.latitude,
        p.longitude,
        array_agg(t.name) AS tags
      FROM places p
      JOIN place_tags pt ON p.id = pt.place_id
      JOIN tags t ON pt.tag_id = t.id
      WHERE t.name = ANY($1)
      AND ST_DWithin(
        p.location,
        ST_MakePoint($2, $3)::geography,
        $4
      )
      GROUP BY p.id;
    `;

    const result = await pool.query(sql, [
      tags,
      lon,
      lat,
      radius,
    ]);

    res.json({
      query: vibe,
      tags,
      places: result.rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});
