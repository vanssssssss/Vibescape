import express from "express";
import searchPlaceRouter from "./routes/searchPlace.js";
import authRouter from "./routes/auth.js";
import favoritesRouter from "./routes/favorites.js";
import memoriesRouter from "./routes/memories.js";
<<<<<<< HEAD
import locationRouter from "./routes/locationRoutes.js";   // ← NEW — for geocoding and nearby search
=======
import favoritesRouter from "./routes/favorites.js";
>>>>>>> c617b4f (favorites page backend api)
import cors from "cors";
import "dotenv/config";

const app = express();
const frontend_url = process.env.FRONTEND_URL;

if (!frontend_url) {
  throw new Error("frontend url is not set");
}

app.use(cors({ origin: frontend_url }));
app.use(express.json());

<<<<<<< HEAD
app.use("/api/v1/search", searchPlaceRouter);   // GET  /api/v1/search?vibe=...
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/memories", memoriesRouter);
app.use("/api/v1/favorites", favoritesRouter);
app.use("/api/location", locationRouter);        // ← NEW: POST /api/location/geocode
                                                 //        GET  /api/location/nearby

app.get("/", (req, res) => {
  res.send("API running");
});

=======
app.use('/api/v1/search',searchPlaceRouter);
app.use('/api/v1/auth',authRouter);
app.use('/api/v1/memories',memoriesRouter);
app.use('/api/v1/favorites',favoritesRouter);
<<<<<<< HEAD
app.get('/',(req, res) => { res.send("API running")});
=======
>>>>>>> c617b4f (favorites page backend api)

>>>>>>> df7c7cc (Update app.ts)
export default app;
