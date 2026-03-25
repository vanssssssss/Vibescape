import {Router} from "express";
import { register,login,forgotPassword,resetPassword,verifyEmail,resendVerification } from "../controllers/auth.js";

const router = Router();

router.route('/register').post(register)
router.route('/login').post(login)
router.route('/forgot-password').post(forgotPassword)
router.route('/reset-password').post(resetPassword)
router.route('/verify-email').get(verifyEmail)
router.route('/resend-verification').post(resendVerification);

export default router;