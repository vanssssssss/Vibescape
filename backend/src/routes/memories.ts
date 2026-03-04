import {Router} from "express";
import { createMemory, getAllMemories } from "../controllers/memories.js";
const router = Router();

router.route('/').post(createMemory);
router.route('/').get(getAllMemories);

export default router;