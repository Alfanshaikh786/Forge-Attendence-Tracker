import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

async function createMentor() {
  if (!connectionString) {
    console.error('DATABASE_URL is not set in backend/.env');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    const email = 'mentor@forgetrack.com';
    const password = 'password123';
    const name = 'Admin Mentor';

    // Check if user exists
    const existing = await pool.query('SELECT * FROM public.users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('Mentor user already exists:', email);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    // The current schema.sql doesn't have password_hash. I'll add it.
    console.log('Adding password_hash column to users table...');
    await pool.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT');

    await pool.query(
      'INSERT INTO public.users (id, email, role, display_name, password_hash) VALUES ($1, $2, $3, $4, $5)',
      [id, email, 'mentor', name, passwordHash]
    );

    console.log('-----------------------------------');
    console.log('Mentor user created successfully in Supabase!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('-----------------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating mentor:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createMentor();
