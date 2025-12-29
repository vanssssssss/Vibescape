import express from "express";
import SearchPlaceRouter from "./routes/searchPlace.js";

const app = express();

app.use(express.json());
app.use('/api/v1/search',SearchPlaceRouter);

export default app;