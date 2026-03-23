import express from "express";
import searchPlaceRouter from "./routes/searchPlace.js";
import authRouter from "./routes/auth.js";
import favoritesRouter from "./routes/favorites.js";
import memoriesRouter from "./routes/memories.js";
import favoritesRouter from "./routes/favorites.js";
import cors from "cors";
import "dotenv/config";
import { initTagVectors } from "./nlp/tagVectors.js";

const app = express();
const frontend_url = process.env.FRONTEND_URL;

if (!frontend_url) {
  throw new Error("frontend url is not set");
}

app.use(cors({origin:frontend_url}));

app.use(express.json());
await initTagVectors();

app.use('/api/v1/search',searchPlaceRouter);
app.use('/api/v1/auth',authRouter);
app.use('/api/v1/memories',memoriesRouter);
app.use('/api/v1/favorites',favoritesRouter);
app.get('/',(req, res) => { res.send("API running")});

export default app;
