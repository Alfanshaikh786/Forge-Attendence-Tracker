import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { requireAuth, requireMentor } from '../middleware/auth.js';

const router = express.Router();

// GET /api/mentor/students - List all students for this mentor
router.get('/students', requireAuth, requireMentor, async (req, res) => {
  try {
    const studentsResult = await query(
      `SELECT 
        s.id as "_id", 
        s.name as "fullName", 
        s.usn, 
        s.email, 
        s.branch_code as "department", 
        s.batch as "batchYear",
        (SELECT COUNT(*) FROM public.sessions) as total_sessions,
        (SELECT COUNT(*) FROM public.attendance a WHERE a.student_id = s.id AND a.present = true) as present_sessions
       FROM public.students s 
       ORDER BY s.name ASC`,
      []
    );
    
    const students = studentsResult.rows.map(s => ({
      ...s,
      attendancePercentage: s.total_sessions > 0 ? Math.round((s.present_sessions / s.total_sessions) * 100) : 0
    }));

    return res.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// POST /api/mentor/add-student - Add a new student
router.post('/add-student', requireAuth, requireMentor, async (req, res) => {
  try {
    const { fullName, usn, email, department, batchYear, password, confirmPassword } = req.body;

    if (!fullName || !usn || !email || !department || !batchYear || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    
    // 1. Insert student
    const studentResult = await query(
      'INSERT INTO public.students (name, usn, email, branch_code, batch) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [fullName, usn.toUpperCase(), email.toLowerCase(), department, batchYear]
    );
    const studentId = studentResult.rows[0].id;

    // 2. Insert user
    const userId = uuidv4();
    await query(
      'INSERT INTO public.users (id, email, role, display_name, student_id, password_hash) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, email.toLowerCase(), 'student', fullName, studentId, passwordHash]
    );

    return res.status(201).json({
      success: true,
      message: 'Student added successfully',
    });
  } catch (error) {
    console.error('Error adding student:', error);
    return res.status(500).json({ error: 'Failed to add student' });
  }
});

// GET /api/mentor/stats - Get dashboard statistics
router.get('/stats', requireAuth, requireMentor, async (req, res) => {
  try {
    const studentsCount = await query('SELECT COUNT(*) FROM public.students WHERE is_active = true');
    const sessionsCount = await query('SELECT COUNT(*) FROM public.sessions');
    
    const today = new Date().toISOString().split('T')[0];
    const sessionResult = await query('SELECT * FROM public.sessions WHERE date = $1', [today]);
    const session = sessionResult.rows[0];

    let todayStats = {
      total: 0,
      present: 0,
      absent: 0,
      sessionTopic: 'No session today',
      absentStudents: []
    };

    if (session) {
      const attendanceResult = await query(
        `SELECT a.present, s.name as "fullName", s.usn 
         FROM public.attendance a 
         JOIN public.students s ON a.student_id = s.id 
         WHERE a.session_id = $1`,
        [session.id]
      );
      
      const attendance = attendanceResult.rows;
      todayStats.total = attendance.length;
      todayStats.present = attendance.filter(a => a.present).length;
      todayStats.absent = todayStats.total - todayStats.present;
      todayStats.sessionTopic = session.topic;
      todayStats.absentStudents = attendance.filter(a => !a.present).map(a => ({
        fullName: a.fullName,
        usn: a.usn
      }));
    }

    return res.json({
      stats: {
        totalStudents: parseInt(studentsCount.rows[0].count),
        totalSessions: parseInt(sessionsCount.rows[0].count),
        avgAttendance: 0,
        today: todayStats
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/mentor/sessions/:date - Get or create a session for a date
router.get('/sessions/:date', requireAuth, requireMentor, async (req, res) => {
  try {
    const { date } = req.params;
    const sessionDate = new Date(date).toISOString().split('T')[0];

    let sessionResult = await query('SELECT * FROM public.sessions WHERE date = $1', [sessionDate]);
    
    if (sessionResult.rows.length === 0) {
      sessionResult = await query(
        'INSERT INTO public.sessions (date, topic, month_number) VALUES ($1, $2, $3) RETURNING *',
        [sessionDate, 'New Session', new Date(date).getMonth() + 1]
      );
    }

    const session = sessionResult.rows[0];
    return res.json({ session: { ...session, _id: session.id } });
  } catch (error) {
    console.error('Error fetching session:', error);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// GET /api/mentor/sessions/:id/attendance - Get attendance for a specific session
router.get('/sessions/:id/attendance', requireAuth, requireMentor, async (req, res) => {
  try {
    const { id } = req.params;
    
    const attendanceResult = await query(
      `SELECT a.student_id as "studentId", a.present as "status", s.name as "fullName", s.usn, s.branch_code as "department"
       FROM public.attendance a 
       JOIN public.students s ON a.student_id = s.id
       WHERE a.session_id = $1`,
      [id]
    );
    
    let students = [];
    if (attendanceResult.rows.length > 0) {
      students = attendanceResult.rows.map(a => ({
        ...a,
        _id: a.studentId,
        status: a.status ? 'present' : 'absent'
      }));
    } else {
      const allStudents = await query('SELECT id as "_id", name as "fullName", usn, branch_code as "department" FROM public.students WHERE is_active = true');
      students = allStudents.rows.map(s => ({
        ...s,
        studentId: s._id,
        status: 'absent'
      }));
    }

    return res.json({ students });
  } catch (error) {
    console.error('Error fetching session attendance:', error);
    return res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// POST /api/mentor/sessions/:id/attendance - Save attendance for a session
router.post('/sessions/:id/attendance', requireAuth, requireMentor, async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance, topic } = req.body; 

    if (topic) {
      await query('UPDATE public.sessions SET topic = $1 WHERE id = $2', [topic, id]);
    }

    for (const record of attendance) {
      await query(
        'INSERT INTO public.attendance (student_id, session_id, present, marked_by) VALUES ($1, $2, $3, $4) ON CONFLICT (student_id, session_id) DO UPDATE SET present = $3',
        [record.studentId, id, record.status === 'present', req.auth.user.displayName]
      );
    }

    return res.json({ success: true, message: 'Attendance saved' });
  } catch (error) {
    console.error('Error saving attendance:', error);
    return res.status(500).json({ error: 'Failed to save attendance' });
  }
});

// MATERIALS ENDPOINTS
router.get('/materials', requireAuth, requireMentor, async (req, res) => {
  try {
    const materialsResult = await query(
      `SELECT m.id as "_id", m.title, m.description, m.url, m.type, m.created_at as "createdAt", 
              s.topic as "sessionTopic"
       FROM public.materials m
       LEFT JOIN public.sessions s ON m.session_id = s.id
       ORDER BY m.created_at DESC`
    );
    return res.json({ materials: materialsResult.rows });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

router.post('/materials', requireAuth, requireMentor, async (req, res) => {
  try {
    const { title, description, url, type, sessionId } = req.body;
    const materialResult = await query(
      `INSERT INTO public.materials (title, description, url, type, session_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id as "_id"`,
      [title, description, url, type, sessionId]
    );
    return res.json({ success: true, material: materialResult.rows[0] });
  } catch (error) {
    console.error('Error adding material:', error);
    return res.status(500).json({ error: 'Failed to add material' });
  }
});

export default router;
