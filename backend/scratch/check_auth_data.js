import { query } from '../src/db.js';

async function listAssignments() {
  try {
    const res = await query(`
      SELECT f.name as faculty_name, f.email, s.id as subject_id, s.name as subject_name
      FROM public.subjects s
      JOIN public.faculty f ON s.assigned_faculty_id = f.id
    `);
    console.log('Assignments:', JSON.stringify(res.rows, null, 2));
    
    const sessions = await query(`
      SELECT id, subject_id, topic FROM public.sessions WHERE id IN (24, 25, 26)
    `);
    console.log('Sessions 24-26:', JSON.stringify(sessions.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

listAssignments();
