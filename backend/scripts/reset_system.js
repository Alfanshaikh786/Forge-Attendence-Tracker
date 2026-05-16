import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetSystem() {
  const client = await pool.connect();
  try {
    console.log('--- FORGETRACK SYSTEM RESET INITIATED ---');
    
    await client.query('BEGIN');

    // 1. Clear Attendance Records
    console.log('Clearing attendance records...');
    await client.query('DELETE FROM public.attendance');

    // 2. Clear Sessions
    console.log('Clearing faculty sessions...');
    await client.query('DELETE FROM public.sessions');

    // 3. Clear Materials
    console.log('Clearing materials/resources...');
    await client.query('DELETE FROM public.materials');

    // 4. Clear Messages & Announcements
    console.log('Clearing communication history...');
    await client.query('DELETE FROM public.messages');
    await client.query('DELETE FROM public.announcements');

    // 5. Clear Student Users
    console.log('Clearing student user accounts...');
    await client.query("DELETE FROM public.users WHERE role = 'student'");

    // 6. Clear Students Registry
    console.log('Clearing student registry...');
    await client.query('DELETE FROM public.students');

    // Note: We are KEEPING public.faculty and public.users (mentors)
    // and public.subjects (which defines the authorization system).

    await client.query('COMMIT');
    console.log('--- RESET COMPLETE: Database is now clean for fresh import ---');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('--- RESET FAILED ---');
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

resetSystem();
