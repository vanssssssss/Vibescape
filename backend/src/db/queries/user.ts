import { pool } from "../db.js";

export async function createUser(
  name: string,
  email: string,
  password: string,
) {
  const result = await pool.query(
    `INSERT INTO users(name,email,password) VALUES ($1,$2,$3) RETURNING user_id, email`,
    [name, email, password],
  );

  return result.rows[0] || null;
}

export async function sendVerificationToken(token: string, userId: string) {
  await pool.query(
    `UPDATE users SET verify_token = $1, verify_token_expiry = NOW() + INTERVAL '15 minutes' Where user_id = $2`,
    [token, userId],
  );
}

export async function markEmailVerified(userId: string) {
  await pool.query(
    `UPDATE users SET is_verified = true, verify_token = NULL, verify_token_expiry = NULL Where user_id = $1`,
    [userId],
  );
}

export async function findUserByEmail(email: string) {
  const result = await pool.query(
    `SELECT user_id, password, is_verified, role FROM users WHERE email = $1`,
    [email],
  );

  return result.rows[0] || null;
}

export async function findUserByVerificationToken(token: string) {
  const result = await pool.query(
    `SELECT user_id FROM users WHERE verify_token = $1`,
    [token],
  );

  return result.rows[0] || null;
}

export async function updateUserPassword(
  userId: string,
  hashedPassword: string,
) {
  await pool.query(`UPDATE users SET password = $1 WHERE user_id  = $2`, [
    hashedPassword,
    userId,
  ]);
}
