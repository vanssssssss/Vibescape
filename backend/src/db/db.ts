import {Pool} from "pg";
import "dotenv/config";


const connectionString = process.env.DATABASE_URL;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({
    connectionString:connectionString,
    ssl: {rejectUnauthorized:false},
});

(async () => {
  try {
    await pool.query("select 1");
    console.log("DB connection successful");
  } catch (err) {
    console.error("DB connection failed");
    console.error(err);
  }
})

();