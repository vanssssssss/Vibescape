import {Router} from "express";
import { createMemory,getAllMemories,addImage,addNotes } from "../controllers/memories.js";
import { imagekitAuth } from "../controllers/memories.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.route('/').post(verifyToken, createMemory);
router.route('/').get(verifyToken, getAllMemories);
router.patch("/:memoryId/images", verifyToken, addImage);
router.patch("/:memoryId", verifyToken, addNotes);
router.route('/imagekit-auth').get(imagekitAuth);

export default router;