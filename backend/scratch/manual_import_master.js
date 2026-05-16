import XLSX from 'xlsx';
import { query } from '../src/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const filePath = 'd:/ForgeTrack-main/Data Engineering and AI - Actual Program.xlsx';
const MENTOR_EMAIL = 'mentor@forgetrack.com';
const FACULTY_ID = 'f3fa0eeb-f15a-45bb-8195-59b03ec9ce2e';

async function manualImport() {
  try {
    console.log('🚀 Starting Manual Import for mentor@forgetrack.com...');

    // 1. Create Faculty Record first
    await query(
      'INSERT INTO public.faculty (id, name, short_name, email) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [FACULTY_ID, 'Mentor Admin', 'MA', MENTOR_EMAIL]
    );
    console.log(`✅ Faculty record created: ${FACULTY_ID}`);

    // 2. Assign Faculty ID to mentor
    await query('UPDATE public.users SET faculty_id = $1 WHERE email = $2', [FACULTY_ID, MENTOR_EMAIL]);
    console.log(`✅ Faculty ID assigned to ${MENTOR_EMAIL}`);

    // 2. Create Subject
    const subjectResult = await query(
      'INSERT INTO public.subjects (name, code, assigned_faculty_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id',
      ['DATA ENGINEERING AND AI BOOTCAMP', 'DEAI-2026', FACULTY_ID]
    );
    let subjectId = subjectResult.rows[0]?.id;
    if (!subjectId) {
      const existingSub = await query('SELECT id FROM public.subjects WHERE code = $1', ['DEAI-2026']);
      subjectId = existingSub.rows[0].id;
    }
    console.log(`✅ Subject created/found: ID ${subjectId}`);

    // 3. Read Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = 'Bootcamp Data';
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const rows = data.slice(3); // Data starts from row 3 (0-indexed)
    console.log(`📊 Processing ${rows.length} rows from Excel...`);

    // Day mapping: Day 1 (Index 8), Day 2 (Index 11), ..., Day 10 (Index 35)
    const dayIndices = [8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
    const dayDates = dayIndices.map((_, i) => {
      const d = new Date('2026-05-01'); // Start from May 1st
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    // Create Sessions first
    const sessionIds = [];
    for (const date of dayDates) {
      const monthNum = new Date(date).getMonth() + 1;
      const res = await query(
        'INSERT INTO public.sessions (date, topic, month_number, subject_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [date, `Bootcamp Day ${sessionIds.length + 1}`, monthNum, subjectId]
      );
      sessionIds.push(res.rows[0].id);
    }
    console.log(`✅ ${sessionIds.length} sessions created.`);

    let studentCount = 0;
    let attendanceCount = 0;

    for (const row of rows) {
      const name = row[1];
      const email = row[2];
      const usn = String(row[3]).trim().toUpperCase();
      const branch = row[5];

      if (!usn || usn === 'UNDEFINED') continue;

      // Create Student
      let studentId;
      const existingStudent = await query('SELECT id FROM public.students WHERE usn = $1', [usn]);
      
      if (existingStudent.rows.length > 0) {
        studentId = existingStudent.rows[0].id;
      } else {
        const studentRes = await query(
          'INSERT INTO public.students (name, usn, email, branch_code) VALUES ($1, $2, $3, $4) RETURNING id',
          [name, usn, email, branch || 'GENERAL']
        );
        studentId = studentRes.rows[0].id;
        
        // Create User for student
        const passHash = await bcrypt.hash(String(usn), 10);
        await query(
          'INSERT INTO public.users (id, email, role, display_name, student_id, password_hash) VALUES ($1, $2, $3, $4, $5, $6)',
          [uuidv4(), email || `${usn}@forge.local`, 'student', name, studentId, passHash]
        );
        studentCount++;
      }

      // Add Attendance
      for (let i = 0; i < dayIndices.length; i++) {
        const isPresent = row[dayIndices[i]] === true || row[dayIndices[i]] === 'true';
        if (isPresent) {
          await query(
            'INSERT INTO public.attendance (student_id, session_id, present, marked_by) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
            [studentId, sessionIds[i], true, 'SYSTEM_IMPORT']
          );
          attendanceCount++;
        }
      }
    }

    console.log(`\n🎉 IMPORT COMPLETE!`);
    console.log(`- Students registered: ${studentCount}`);
    console.log(`- Attendance records: ${attendanceCount}`);

  } catch (err) {
    console.error('❌ Import failed:', err);
  } finally {
    process.exit();
  }
}

manualImport();
