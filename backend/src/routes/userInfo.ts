import {Router} from "express";
import { getUserInfo,updateName,updateProfilePic,deleteUser } from "../controllers/userInfo.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.route('/').get(verifyToken, getUserInfo);
router.route('/name').patch(verifyToken, updateName);
router.route('/').delete(verifyToken, deleteUser);
router.route('/profile-pic').patch(verifyToken, updateProfilePic);


export default router;