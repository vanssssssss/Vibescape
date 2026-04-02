import { Router } from "express";
import {
  geocodeLocation,
  getNearbyPlaces,
} from "../controllers/locationController.js";

const router = Router();

// POST /api/location/geocode  — convert text → lat/lng
router.post("/geocode", geocodeLocation);

// GET  /api/location/nearby   — find places near current position
// Query params: lat, lng, radius (default 500 m)
router.get("/nearby", getNearbyPlaces);

export default router;
