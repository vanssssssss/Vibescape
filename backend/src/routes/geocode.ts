import {Router} from "express";
import { autocomplete} from "../controllers/geocode.js";
import {rateLimit} from "express-rate-limit";

const router = Router();
const autocompleteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // max 60 requests per IP per minute
  message: { error: "rate limit exceeded" },
});

router.route('/autocomplete').get(autocompleteLimiter,autocomplete);

export default router;