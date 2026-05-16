import { query } from '../src/db.js';

async function checkMapping() {
  try {
    const res = await query(`
      SELECT u.email, s.name as subject_name
      FROM public.users u
      JOIN public.subjects s ON u.faculty_id = s.assigned_faculty_id
      WHERE u.role = 'mentor'
      ORDER BY u.email ASC
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkMapping();
