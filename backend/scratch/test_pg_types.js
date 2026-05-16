import { query } from '../src/db.js';

async function testQuery() {
  try {
    const targetSubjectId = "12";
    const facultyId = "3951e30a-9b80-4be6-a9c5-02f3d4d279eb";
    const res = await query('SELECT id FROM public.subjects WHERE id = $1 AND assigned_faculty_id = $2', [targetSubjectId, facultyId]);
    console.log("Success:", res.rows);
  } catch (err) {
    console.error("Crash!", err);
  } finally {
    process.exit();
  }
}

testQuery();
