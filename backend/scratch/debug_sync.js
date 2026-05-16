import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();
  try {
    console.log('--- SUBJECTS ---');
    const subjects = await client.query('SELECT id, name, code FROM public.subjects');
    console.table(subjects.rows);

    console.log('--- RECENT SESSIONS ---');
    const sessions = await client.query(`
      SELECT s.id, s.date, s.topic, sub.code as subject_code
      FROM public.sessions s
      JOIN public.subjects sub ON s.subject_id = sub.id
      ORDER BY s.date DESC LIMIT 5
    `);
    console.table(sessions.rows);

    console.log('--- RECENT ATTENDANCE ---');
    const attendance = await client.query(`
      SELECT a.student_id, a.session_id, a.present, s.date, sub.code as subject_code
      FROM public.attendance a
      JOIN public.sessions s ON a.session_id = s.id
      JOIN public.subjects sub ON s.subject_id = sub.id
      ORDER BY s.date DESC LIMIT 5
    `);
    console.table(attendance.rows);

    console.log('--- STUDENT CHECK ---');
    const students = await client.query('SELECT id, name, usn FROM public.students LIMIT 5');
    console.table(students.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
