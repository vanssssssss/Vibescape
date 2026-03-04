import express from "express";
import searchPlaceRouter from "./routes/searchPlace.js";
import mapSearchRouter from "./routes/mapSearch.js";
import authRouter from "./routes/auth.js";
import favoritesRouter from "./routes/favorites.js";
import memoriesRouter from "./routes/memories.js";
import cors from "cors";
import "dotenv/config";

const app = express();
const frontend_url = process.env.FRONTEND_URL;

if (!frontend_url) {
  throw new Error("frontend url is not set");
}

app.use(cors({origin:frontend_url}));

app.use(express.json());

app.use('/api/v1/search', searchPlaceRouter);   // existing: GET /api/v1/search?vibe=...
app.use('/api/v1/search', mapSearchRouter);      // new:      POST /api/v1/search/map
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/memories', memoriesRouter);
app.use('/api/v1/favorites', favoritesRouter);

export default app;