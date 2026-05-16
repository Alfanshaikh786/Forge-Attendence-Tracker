import { query } from '../src/db.js';

async function checkAttendanceSchema() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'attendance' AND table_schema = 'public'
    `);
    console.log('Attendance Schema:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkAttendanceSchema();
