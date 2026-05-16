import { query } from '../src/db.js';

async function checkGlobalCounts() {
  try {
    const students = await query('SELECT COUNT(*) FROM public.students');
    const sessions = await query('SELECT COUNT(*) FROM public.sessions');
    const attendance = await query('SELECT COUNT(*) FROM public.attendance');
    
    console.log('Global Students:', students.rows[0].count);
    console.log('Global Sessions:', sessions.rows[0].count);
    console.log('Global Attendance Records:', attendance.rows[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkGlobalCounts();
