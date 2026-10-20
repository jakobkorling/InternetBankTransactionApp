import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
    host: "localhost",
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB
});

