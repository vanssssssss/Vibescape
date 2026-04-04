import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { getAllUsers,promoteUserToAdmin,demoteAdminTouser,addInterestTag,deleteInterestTag,getAllTags } from "../controllers/admin.js";

const router = Router();

router.route("/users").get(verifyToken,isAdmin,getAllUsers);
router.route("/promote/:id").put(verifyToken,isAdmin,promoteUserToAdmin);
router.route("/demote/:id").put(verifyToken,isAdmin,demoteAdminTouser);
router.route("/tags").post(verifyToken,isAdmin,addInterestTag);
router.route("/tags/:id").delete(verifyToken,isAdmin,deleteInterestTag);
router.route("/tags").get(verifyToken,isAdmin,getAllTags);

export default router;
