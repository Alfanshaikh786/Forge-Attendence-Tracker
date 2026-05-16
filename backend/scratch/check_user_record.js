import { query } from '../src/db.js';

async function checkUserRecord() {
  try {
    const res = await query('SELECT * FROM public.users WHERE email = $1', ['Sadhana@Sahyadri.edu.in']);
    console.log('User Record:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkUserRecord();
