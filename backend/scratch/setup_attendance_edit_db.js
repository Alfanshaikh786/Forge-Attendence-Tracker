import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();
  try {
    console.log('Creating audit log table...');
    await client.query(`
      -- We'll use TEXT for IDs to be safe if they vary, or just match existing
      -- Based on error, sessions.id is likely INTEGER.
      CREATE TABLE IF NOT EXISTS public.attendance_audit (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id INTEGER,
        student_id UUID,
        previous_status BOOLEAN,
        new_status BOOLEAN,
        changed_by TEXT,
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        remarks TEXT
      );

      -- Add status_version to attendance for optimistic locking/history if needed
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='version') THEN
          ALTER TABLE public.attendance ADD COLUMN version INTEGER DEFAULT 1;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='last_edited_by') THEN
          ALTER TABLE public.attendance ADD COLUMN last_edited_by TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='remarks') THEN
          ALTER TABLE public.sessions ADD COLUMN remarks TEXT;
        END IF;
      END $$;
    `);
    console.log('Database schema updated for attendance editing.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
