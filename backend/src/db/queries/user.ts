import { pool } from "../db.js";

export async function createUser(name:string,email:string,password:string){
    const result = await pool.query(
            `INSERT INTO users(name,email,password) VALUES ($1,$2,$3) RETURNING user_id, email`,
            [name,email,password]
        );
    
    return result.rows[0] || null;
}

export async function findUserByEmail(email:string){
    const result = await pool.query(`SELECT user_id, password FROM users WHERE email = $1`,[email]);
    
    return result.rows[0] || null;
}