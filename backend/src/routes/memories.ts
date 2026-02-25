import {Router} from "express";
import { createMemory,getAllMemories } from "../controllers/memories.js";
const router = Router();
import { verifyToken } from "../middleware/auth.js";

router.route('/').post(verifyToken, createMemory);
router.route('/').get(verifyToken, getAllMemories);

export default router;