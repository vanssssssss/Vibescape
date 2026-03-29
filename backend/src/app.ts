import express from "express";
import searchPlaceRouter from "./routes/searchPlace.js";
import authRouter from "./routes/auth.js";
import favoritesRouter from "./routes/favorites.js";
import memoriesRouter from "./routes/memories.js";
import locationRouter from "./routes/locationRoutes.js";   // ← NEW — for geocoding and nearby search
import adminRouter from "./routes/admin.js";    // ← new admin insert, resync, and tag management routes
import cors from "cors";
import "dotenv/config";

const app = express();
const frontend_url = process.env.FRONTEND_URL;

if (!frontend_url) {
  throw new Error("frontend url is not set");
}

app.use(cors({ origin: frontend_url }));
app.use(express.json());


app.use("/api/v1/search", searchPlaceRouter);   // GET  /api/v1/search?vibe=...
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/memories", memoriesRouter);
app.use("/api/v1/favorites", favoritesRouter);
app.use("/api/v1/admin", adminRouter);           // ← NEW: POST /api/v1/admin/tags                        //        POST /api/v1/admin/places
app.use("/api/location", locationRouter);        // ← NEW: POST /api/location/geocode
                                                 //        GET  /api/location/nearby
app.get('/',(req, res) => { res.send("API running")});

export default app;
