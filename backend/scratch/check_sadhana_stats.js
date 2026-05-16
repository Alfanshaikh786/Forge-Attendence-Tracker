import { query } from '../src/db.js';

async function checkSadhanaStats() {
  try {
    const email = 'Sadhana@Sahyadri.edu.in';
    const userRes = await query('SELECT faculty_id FROM public.users WHERE email = $1', [email]);
    const facultyId = userRes.rows[0].faculty_id;
    console.log('Faculty ID:', facultyId);

    // Filter stats by assigned subjects
    const studentsCountRes = await query(`
      SELECT COUNT(DISTINCT a.student_id) 
      FROM public.attendance a
      JOIN public.sessions s ON a.session_id = s.id
      JOIN public.subjects sub ON s.subject_id = sub.id
      WHERE sub.assigned_faculty_id = $1
    `, [facultyId]);

    const sessionsCountRes = await query(`
      SELECT COUNT(s.id) 
      FROM public.sessions s
      JOIN public.subjects sub ON s.subject_id = sub.id
      WHERE sub.assigned_faculty_id = $1
    `, [facultyId]);
    
    console.log('Students Count:', studentsCountRes.rows[0].count);
    console.log('Sessions Count:', sessionsCountRes.rows[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkSadhanaStats();
