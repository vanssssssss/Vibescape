import { pool } from "../db.js";


export async function createPasswordReset(
  userId: string,
  tokenHash: string
) {
  await pool.query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
    [userId, tokenHash]
  );
}

export async function findValidResetToken(tokenHash: string) {
  const result = await pool.query(
    `Select id, user_id, expires_at FROM password_resets WHERE token_hash = $1 and used = false AND expires_at > NOW()`,
    [tokenHash]
  );

  return result.rows[0] || null;
}

export async function markResetTokenUsed(id: string) {
  await pool.query(
    `UPDATE password_resets SET used = true WHERE id = $1`,
    [id]
  );
}
