import { query } from '../src/db.js';

async function deleteOrphanSessions() {
  try {
    const res = await query('DELETE FROM public.sessions WHERE subject_id IS NULL');
    console.log('Deleted orphan sessions:', res.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

deleteOrphanSessions();
