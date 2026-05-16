import { query } from '../src/db.js';

async function checkRecentSessions() {
  try {
    const res = await query('SELECT * FROM public.sessions ORDER BY id DESC LIMIT 10');
    console.log('Recent Sessions:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkRecentSessions();
