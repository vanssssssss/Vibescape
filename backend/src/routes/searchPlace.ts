import {Router} from "express";
import { searchPlace } from "../controllers/searchPlace.js";
const router = Router();

router.route('/').get(searchPlace);

export default router;