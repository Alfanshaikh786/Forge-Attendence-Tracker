import { query } from '../src/db.js';

async function listSubjects() {
  try {
    const res = await query('SELECT * FROM public.subjects ORDER BY code ASC');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

listSubjects();
