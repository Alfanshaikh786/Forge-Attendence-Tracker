import { query } from '../src/db.js';

async function checkStudentsSchema() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'students' AND table_schema = 'public'
    `);
    console.log('Students Schema:', JSON.stringify(res.rows, null, 2));
    
    const count = await query('SELECT COUNT(*) FROM public.students');
    console.log('Student Count:', count.rows[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkStudentsSchema();
