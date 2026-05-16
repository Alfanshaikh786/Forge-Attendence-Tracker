import { query } from '../src/db.js';

async function checkSchema() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sessions' AND table_schema = 'public'
    `);
    console.log('Sessions Schema:', JSON.stringify(res.rows, null, 2));

    const sessions = await query('SELECT id FROM public.sessions LIMIT 5');
    console.log('Sample IDs:', JSON.stringify(sessions.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkSchema();
