import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  await client.connect();
  try {
    console.log('Migrating database for attendance management...');

    // 1. Update attendance table
    await client.query(`
      ALTER TABLE public.attendance 
      ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS last_edited_by TEXT
    `);

    // 2. Update sessions table
    await client.query(`
      ALTER TABLE public.sessions 
      ADD COLUMN IF NOT EXISTS remarks TEXT,
      ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP
    `);

    // 3. Update attendance_audit table to match frontend expectations
    // First check if it exists
    const checkAudit = await client.query("SELECT * FROM information_schema.tables WHERE table_name = 'attendance_audit'");
    if (checkAudit.rows.length === 0) {
      await client.query(`
        CREATE TABLE public.attendance_audit (
          id SERIAL PRIMARY KEY,
          session_id INTEGER REFERENCES public.sessions(id),
          student_id UUID REFERENCES public.students(id),
          previous_status BOOLEAN,
          new_status BOOLEAN,
          changed_by TEXT,
          remarks TEXT,
          changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      // Rename columns if they were old ones
      await client.query("ALTER TABLE public.attendance_audit RENAME COLUMN old_status TO previous_status").catch(() => {});
      await client.query("ALTER TABLE public.attendance_audit RENAME COLUMN edited_by TO changed_by").catch(() => {});
      
      // Ensure columns exist anyway
      await client.query(`
        ALTER TABLE public.attendance_audit 
        ADD COLUMN IF NOT EXISTS previous_status BOOLEAN,
        ADD COLUMN IF NOT EXISTS changed_by TEXT,
        ADD COLUMN IF NOT EXISTS remarks TEXT
      `).catch(() => {});
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration Error:', err);
  } finally {
    await client.end();
  }
}

migrate();
