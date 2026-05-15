import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = "postgresql://postgres:Alfiya@786934@db.tpwjuztjqpnnrqrhdrxw.supabase.co:5432/postgres";

async function runSchema() {
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
    console.log('Executing schema...');
    
    // Split by semicolon but handle triggers/functions (naive split)
    // Actually, running the whole block might work if pg supports it
    await pool.query(sql);
    
    console.log('Schema executed successfully!');
  } catch (error) {
    console.error('Error executing schema:', error);
  } finally {
    await pool.end();
  }
}

runSchema();
