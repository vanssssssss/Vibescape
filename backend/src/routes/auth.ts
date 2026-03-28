import {Router} from "express";
import { register,login,forgotPassword,resetPassword,verifyEmail,resendVerification,changePassword,logout } from "../controllers/auth.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.route('/register').post(register)
router.route('/login').post(login)
router.route('/forgot-password').post(forgotPassword)
router.route('/reset-password').post(resetPassword)
router.route('/verify-email').get(verifyEmail)
router.route('/resend-verification').post(resendVerification);
router.route('/change-password').patch(verifyToken,changePassword);
router.route('/logout').post(verifyToken,logout);

export default router;