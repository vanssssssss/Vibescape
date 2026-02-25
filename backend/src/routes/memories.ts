import {Router} from "express";
<<<<<<< HEAD
import { createMemory, getAllMemories } from "../controllers/memories.js";
=======
import { createMemory,getAllMemories } from "../controllers/memories.js";
>>>>>>> efdf266 (authorization using jwt)
const router = Router();
import { verifyToken } from "../middleware/auth.js";

router.route('/').post(verifyToken, createMemory);
router.route('/').get(verifyToken, getAllMemories);

export default router;