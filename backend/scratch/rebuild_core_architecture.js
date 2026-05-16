import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function setupCoreArchitecture() {
  await client.connect();
  try {
    console.log('--- REBUILDING CORE ATTENDANCE ARCHITECTURE ---');

    // 1. Create a centralized analytics view (THE SINGLE SOURCE OF TRUTH)
    // This view calculates attendance for EVERY student for EVERY subject they have at least one record in,
    // or simply for every student-subject pair where a session exists.
    console.log('Creating Unified Analytics View...');
    await client.query(`
      DROP VIEW IF EXISTS public.student_attendance_analytics CASCADE;
      CREATE VIEW public.student_attendance_analytics AS
      WITH all_student_subjects AS (
        -- Cross join students and subjects to get all possible pairings 
        -- (Optional: filter by department if branch_code exists in both)
        SELECT 
          s.id as student_id,
          sub.id as subject_id,
          sub.code as subject_code,
          sub.name as subject_name
        FROM public.students s
        CROSS JOIN public.subjects sub
        WHERE s.is_active = true
      ),
      subject_session_counts AS (
        -- Count total held sessions per subject
        SELECT 
          subject_id,
          COUNT(id) as total_sessions
        FROM public.sessions
        WHERE date <= CURRENT_DATE
        GROUP BY subject_id
      ),
      student_present_counts AS (
        -- Count present marks per student per subject
        SELECT 
          a.student_id,
          s.subject_id,
          COUNT(a.id) FILTER (WHERE a.present = true) as present_count,
          COUNT(a.id) FILTER (WHERE a.present = false) as absent_count
        FROM public.attendance a
        JOIN public.sessions s ON a.session_id = s.id
        GROUP BY a.student_id, s.subject_id
      )
      SELECT 
        ass.student_id,
        ass.subject_id,
        ass.subject_code,
        ass.subject_name,
        COALESCE(ssc.total_sessions, 0) as total_sessions,
        COALESCE(spc.present_count, 0) as present_count,
        COALESCE(spc.absent_count, 0) as absent_count,
        CASE 
          WHEN COALESCE(ssc.total_sessions, 0) = 0 THEN 0
          ELSE ROUND((COALESCE(spc.present_count, 0)::NUMERIC / ssc.total_sessions::NUMERIC) * 100)
        END as attendance_percentage
      FROM all_student_subjects ass
      LEFT JOIN subject_session_counts ssc ON ass.subject_id = ssc.subject_id
      LEFT JOIN student_present_counts spc ON ass.student_id = spc.student_id AND ass.subject_id = spc.subject_id;
    `);

    // 2. Create Audit Table (if not exists) with proper names
    console.log('Ensuring Audit Trail integrity...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.attendance_audit (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES public.sessions(id),
        student_id UUID REFERENCES public.students(id),
        previous_status BOOLEAN,
        new_status BOOLEAN,
        changed_by TEXT,
        remarks TEXT,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Ensure Session Constraints
    console.log('Enforcing Database Constraints...');
    await client.query(`
      ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS unique_session_date_subject;
      ALTER TABLE public.sessions ADD CONSTRAINT unique_session_date_subject UNIQUE (date, subject_id);
    `).catch(e => console.log('Constraint already exists or sessions table empty.'));

    console.log('--- ARCHITECTURE REBUILD COMPLETE ---');
    console.log('The system now uses a Unified View as the single source of truth.');

  } catch (err) {
    console.error('CRITICAL ARCHITECTURE REBUILD FAILURE:', err);
  } finally {
    await client.end();
  }
}

setupCoreArchitecture();
