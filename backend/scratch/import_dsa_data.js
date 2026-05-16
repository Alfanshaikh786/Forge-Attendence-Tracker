import XLSX from 'xlsx';
import { query } from '../src/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const filePath = 'd:/ForgeTrack-main/DATA_STRUCTURES_AND_APPLICATIONS_Eligibility_List.xlsx';
const FACULTY_EMAIL = 'Sadhana@Sahyadri.edu.in';
const SUBJECT_ID = 12; // DATA STRUCTURES AND APPLICATIONS

async function importDSA() {
  try {
    console.log(`🚀 Starting DSA Import for ${FACULTY_EMAIL}...`);

    // 1. Get Faculty ID
    const facultyRes = await query('SELECT faculty_id FROM public.users WHERE email = $1', [FACULTY_EMAIL]);
    const facultyId = facultyRes.rows[0].faculty_id;
    console.log(`✅ Faculty ID: ${facultyId}`);

    // 2. Read Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = 'Eligibility List';
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const rows = data.slice(1); // Skip header
    console.log(`📊 Processing ${rows.length} students...`);

    // 3. Create a Consolidated Session
    const sessionRes = await query(
      'INSERT INTO public.sessions (date, topic, month_number, subject_id) VALUES ($1, $2, $3, $4) RETURNING id',
      ['2026-05-16', 'Consolidated Attendance (Eligibility Check)', 5, SUBJECT_ID]
    );
    const sessionId = sessionRes.rows[0].id;
    console.log(`✅ Session created: ID ${sessionId}`);

    let count = 0;
    for (const row of rows) {
      const name = row[1];
      const usn = String(row[2]).trim().toUpperCase();
      const attendancePct = parseFloat(row[6]);

      if (!usn || usn === 'UNDEFINED') continue;

      // Register/Update Student
      let studentId;
      const existing = await query('SELECT id FROM public.students WHERE usn = $1', [usn]);
      
      if (existing.rows.length > 0) {
        studentId = existing.rows[0].id;
        await query('UPDATE public.students SET name = $1 WHERE id = $2', [name, studentId]);
      } else {
        const res = await query(
          'INSERT INTO public.students (name, usn, branch_code, batch) VALUES ($1, $2, $3, $4) RETURNING id',
          [name, usn, 'CS', '2024-2028']
        );
        studentId = res.rows[0].id;

        // Create User
        const passHash = await bcrypt.hash(String(usn), 10);
        await query(
          'INSERT INTO public.users (id, email, role, display_name, student_id, password_hash) VALUES ($1, $2, $3, $4, $5, $6)',
          [uuidv4(), `${usn}@sahydri.local`, 'student', name, studentId, passHash]
        );
      }

      // Mark Attendance (Present if they are on the eligibility list)
      await query(
        'INSERT INTO public.attendance (student_id, session_id, present, marked_by) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [studentId, sessionId, true, 'DSA_IMPORT']
      );
      count++;
    }

    console.log(`\n🎉 IMPORT COMPLETE!`);
    console.log(`- Students processed: ${count}`);

  } catch (err) {
    console.error('❌ Import failed:', err);
  } finally {
    process.exit();
  }
}

importDSA();
