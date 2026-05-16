import XLSX from 'xlsx';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
const filePath = "d:/ForgeTrack-main/Forge-Track/Data Engineering and AI - Actual Program.xlsx";

async function importData() {
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

    const daySessions = {};
    for (let i = 1; i <= 10; i++) {
      const dayName = `Day ${i}`;
      const date = new Date();
      date.setDate(date.getDate() - (11 - i));
      const dateStr = date.toISOString().split('T')[0];

      const res = await pool.query(
        'INSERT INTO public.sessions (date, topic, month_number) VALUES ($1, $2, $3) ON CONFLICT (date) DO UPDATE SET topic = $2 RETURNING id',
        [dateStr, dayName, date.getMonth() + 1]
      );
      daySessions[dayName] = res.rows[0].id;
    }

    const defaultPasswordHash = await bcrypt.hash('password123', 12);
    const students = data.slice(3);
    let importCount = 0;
    let skipCount = 0;

    for (const row of students) {
      try {
        if (!row[1] || !row[2] || !row[3]) {
          skipCount++;
          continue;
        }

        const name = row[1];
        const email = row[2].toLowerCase();
        const usn = row[3].toUpperCase();
        const branch = row[5] || 'CI'; // Default to CI if missing

        const studentRes = await pool.query(
          'INSERT INTO public.students (name, usn, email, branch_code, batch) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (usn) DO UPDATE SET name = $1, email = $3 RETURNING id',
          [name, usn, email, branch, '2024']
        );
        const studentId = studentRes.rows[0].id;

        await pool.query(
          'INSERT INTO public.users (id, email, role, display_name, student_id, password_hash) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING',
          [uuidv4(), email, 'student', name, studentId, defaultPasswordHash]
        );

        const attendanceIndices = [8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
        for (let i = 0; i < 10; i++) {
          const dayName = `Day ${i + 1}`;
          const sessionId = daySessions[dayName];
          const status = row[attendanceIndices[i]];
          const isPresent = status === 'TRUE' || status === 'true' || status === true;

          await pool.query(
            'INSERT INTO public.attendance (student_id, session_id, present, marked_by) VALUES ($1, $2, $3, $4) ON CONFLICT (student_id, session_id) DO UPDATE SET present = $3',
            [studentId, sessionId, isPresent, 'System Import']
          );
        }

        importCount++;
        if (importCount % 20 === 0) console.log(`Imported ${importCount} students...`);
      } catch (e) {
        console.warn(`Failed to import student at row ${students.indexOf(row) + 4}:`, e.message);
      }
    }

    console.log(`Successfully imported ${importCount} students! (Skipped ${skipCount} empty rows)`);
  } catch (error) {
    console.error('Import process failed:', error);
  } finally {
    await pool.end();
  }
}

importData();
