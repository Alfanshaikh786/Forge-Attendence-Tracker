import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

let isConnected = false;

export async function connectDatabase() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to Supabase (PostgreSQL)');
    client.release();
    isConnected = true;
    return pool;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error.message);
    isConnected = false;
    throw error;
  }
}

export function isDbConnected() {
  return isConnected;
}

export const query = (text, params) => pool.query(text, params);

export default pool;
