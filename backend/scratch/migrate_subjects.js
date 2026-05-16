import { query } from '../src/db.js';

async function migrate() {
  try {
    console.log('Starting migration for multiple subjects...');

    // 1. Create subjects table
    await query(`
      CREATE TABLE IF NOT EXISTS public.subjects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Created subjects table.');

    // 2. Modify sessions table
    // Drop unique constraint on date if it exists
    await query(`
      ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_date_key
    `);
    console.log('Dropped unique constraint on sessions.date.');

    // Add subject_id column
    await query(`
      ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES public.subjects(id)
    `);
    console.log('Added subject_id column to sessions.');

    // 3. Add RLS for subjects
    await query(`ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY`);
    await query(`DROP POLICY IF EXISTS "mentors_all_subjects" ON public.subjects`);
    await query(`CREATE POLICY "mentors_all_subjects" ON public.subjects AS PERMISSIVE FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor' )`);
    await query(`DROP POLICY IF EXISTS "students_read_all_subjects" ON public.subjects`);
    await query(`CREATE POLICY "students_read_all_subjects" ON public.subjects FOR SELECT USING ( true )`);
    console.log('Applied RLS policies to subjects.');

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
