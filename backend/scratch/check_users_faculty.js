import { query } from '../src/db.js';

async function checkUsers() {
  try {
    const res = await query("SELECT id, email, role, faculty_id FROM public.users WHERE role = 'mentor'");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkUsers();
