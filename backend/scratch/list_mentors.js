import { query } from '../src/db.js';

async function listUsers() {
  try {
    const res = await query("SELECT email FROM public.users WHERE role = 'mentor' ORDER BY email ASC");
    console.log(res.rows.map(r => r.email));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

listUsers();
