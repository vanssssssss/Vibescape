import {Router} from "express";
import { register,login,forgotPassword,resetPassword } from "../controllers/auth.js";

const router = Router();

router.route('/register').post(register)
router.route('/login').post(login)
router.route('/forgot-password').post(forgotPassword)
router.route('/reset-password').post(resetPassword)

export default router;