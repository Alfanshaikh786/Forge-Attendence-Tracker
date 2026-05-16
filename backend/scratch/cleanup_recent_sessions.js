import { query } from '../src/db.js';

async function cleanupSessions() {
  try {
    const res = await query('DELETE FROM public.sessions WHERE id >= 30');
    console.log('Deleted bad sessions:', res.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

cleanupSessions();
