import type { Response, Request } from "express";
import {
  registerUser,
  loginUser,
  resetPasswordWithToken,
} from "../services/auth.js";
import {
  findUserByEmail,
  markEmailVerified,
  sendVerificationToken,
  findUserByVerificationToken,
} from "../db/queries/user.js";
import { generateResetToken, hashToken } from "../utils/token.js";
import { sendResetMail, sendMailVerification } from "../services/sendMail.js";
import { createPasswordReset } from "../db/queries/passwordReset.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../db/db.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { updateUserPassword } from "../db/queries/user.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}


export const register = async (req: Request, res: Response) => {
  const name = req.body.name;
  const email = req.body.email?.toLowerCase().trim();
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  console.log("register");

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "Missing fields!" });
  }

  if (password != confirmPassword) {
    return res
      .status(400)
      .json({ message: "Password do not match! Try again" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password should atleast be of 8 characters" });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must include uppercase, lowercase, number and special character",
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  try {
    const registeredUser = await registerUser(name, email, password);

    const userId = registeredUser.user_id;
    const userEmail = registeredUser.email;

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    await sendVerificationToken(hashedToken, userId);
    console.log(token);

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await sendMailVerification(email, verificationUrl);

    return res
      .status(201)
      .json({
        message: "User created successfully!",
        user_id: userId,
        email: userEmail,
        token,
      });
  } catch (err: any) {
    if (err.message == "EMAIL_EXISTS") {
      return res
        .status(409)
        .json({ message: "Account with this email already exists!" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  const email = req.body.email?.toLowerCase().trim();
  const password = req.body.password;

  console.log("login");

  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields!" });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }
  try {
    const user = await loginUser(email, password);
    // console.log(user);
    const token = jwt.sign(
      { id: user.user_id,
        role: user.role
       },
      process.env.JWT_SECRET_KEY as string,
      { expiresIn: "2h" },
    );

    return res
      .status(200)
      .json({
        message: "User logged in successfully!",
        user_id: user.user_id,
        token,
        role: user.role
      });
  } catch (err: any) {
    if (err.message == "INVALID_CREDENTIALS") {
      return res
        .status(401)
        .json({ message: "wrong username or password. Try again!!!" });
    }
    if (err.message == "NOT_VERIFIED") {
      return res.status(401).json({ message: "Email not verified" });
    }
    return res
      .status(500)
      .json({ message: "Internal server error", error: err });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const email = req.body.email?.toLowerCase().trim();

  console.log("forgot password");
  if (!email) {
    return res.status(400).json({ message: "Missing fields!" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      message: "Invalid email",
    });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res
      .status(200)
      .json({ message: "If the email exists, a reset link was sent" });
  }

  const rawToken = generateResetToken();
  const tokenHash = hashToken(rawToken);
  await createPasswordReset(user.user_id, tokenHash);

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  try {
    await sendResetMail(email, resetUrl);
  } catch (err: any) {
    console.error("Reset email failed", err.message);
  }
  return res
    .status(200)
    .json({ msg: "If the email exists, a reset link was sent." });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword, confirmPassword } = req.body;

  console.log("reset password");
  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (newPassword != confirmPassword) {
    return res
      .status(400)
      .json({ message: "Password do not match! Try again" });
  }
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "Password should atleast be of 8 characters" });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message:
        "Password must include uppercase, lowercase, number and special character",
    });
  }

  const success = await resetPasswordWithToken(token, newPassword);

  if (!success) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
  return res.status(200).json({ message: "Password reset successful" });
};

const validateEmail = (email: string) => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return EMAIL_REGEX.test(email);
};

export const verifyEmail = async (req: Request, res: Response) => {
  const token = req.query.token;
  console.log("email verificstion");

  if (!token) {
    return res.status(400).json({ message: "Token is missing!" });
  }

  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(token as string)
      .digest("hex");

    const user = await findUserByVerificationToken(hashedToken);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const userId = user.user_id;

    await markEmailVerified(userId);

    return res.json({ message: "Email verified successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  const email = req.body.email?.toLowerCase().trim();

  console.log("verification resend");
  if (!email) {
    return res.status(400).json({ message: "Missing fields!" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      message: "Invalid email",
    });
  }
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res
        .status(200)
        .json({ message: "If the email exists, a reset link was sent" });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(token as string)
      .digest("hex");

    await sendVerificationToken(hashedToken, user.user_id);

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await sendMailVerification(email, verificationUrl);
  } catch (err: any) {
    console.error("email for verification failed", err.message);
  }
  return res
    .status(200)
    .json({ msg: "If the email exists, a reset link was sent." });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  console.log("change password");
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (newPassword != confirmPassword) {
    return res
      .status(400)
      .json({ message: "Password do not match! Try again" });
  }

  if (newPassword != confirmPassword) {
    return res
      .status(400)
      .json({ message: "Password do not match! Try again" });
  }
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "Password should atleast be of 8 characters" });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message:
        "Password must include uppercase, lowercase, number and special character",
    });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

    const user = await pool.query(
      `SELECT password FROM users WHERE user_id = $1`,
      [userId],
    );

    if (user.rowCount == 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValid = await comparePassword(oldPassword, user.rows[0].password);

    if (!isValid) {
      return res.status(401).json({ message: "Incorrect old password" });
    }

    if (oldPassword == newPassword) {
      return res
        .status(400)
        .json({ message: "New password must be different" });
    }

    const hashed_pwd = await hashPassword(newPassword);

    await updateUserPassword(userId, hashed_pwd);

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error" });
  }
};
