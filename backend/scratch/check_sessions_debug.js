import { query } from '../src/db.js';

async function checkSessions() {
  try {
    const res = await query(`
      SELECT s.id, s.date, s.subject_id, sub.name as subject_name, sub.assigned_faculty_id
      FROM public.sessions s
      LEFT JOIN public.subjects sub ON s.subject_id = sub.id
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkSessions();
