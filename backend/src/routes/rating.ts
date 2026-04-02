import { Router } from "express";
import { addRating } from "../controllers/rating.js";

const router = Router();

router.post("/rate", addRating);

export default router;
