import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function setup() {
  await client.connect();
  try {
    console.log('Adding UNIQUE constraint to sessions to prevent duplication...');
    
    // 1. Remove any existing duplicates first to prevent constraint failure
    await client.query(`
      DELETE FROM public.sessions a USING public.sessions b
      WHERE a.id > b.id 
      AND a.date = b.date 
      AND a.subject_id = b.subject_id
    `);

    // 2. Add the unique constraint
    await client.query(`
      ALTER TABLE public.sessions 
      ADD CONSTRAINT unique_session_date_subject UNIQUE (date, subject_id)
    `);

    console.log('Constraint added successfully.');

    // 3. Fix attendance records that might be linked to orphaned sessions
    console.log('Cleaning up orphaned attendance records...');
    await client.query(`
      DELETE FROM public.attendance 
      WHERE session_id NOT IN (SELECT id FROM public.sessions)
    `);

    console.log('Database integrity restored.');

  } catch (err) {
    if (err.code === '23505' || err.message.includes('already exists')) {
      console.log('Constraint already exists. Skipping.');
    } else {
      console.error('Setup Error:', err);
    }
  } finally {
    await client.end();
  }
}

setup();
