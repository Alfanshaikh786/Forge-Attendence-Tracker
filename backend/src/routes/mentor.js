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

// GET /api/mentor/students/:id/analytics
router.get('/students/:id/analytics', requireAuth, requireMentor, async (req, res) => {
  try {
    const { id } = req.params;

    const historyResult = await query(
      `SELECT a.present, a.marked_at, s.date, s.topic, s.duration_hours
       FROM public.attendance a
       JOIN public.sessions s ON a.session_id = s.id
       WHERE a.student_id = $1
       ORDER BY s.date ASC`,
      [id]
    );

    const history = historyResult.rows.map(r => ({
      date: r.date,
      topic: r.topic,
      status: r.present ? 'present' : 'absent',
      duration: r.duration_hours,
      markedAt: r.marked_at
    }));

    const totalSessionsResult = await query('SELECT COUNT(*) FROM public.sessions');
    const total = parseInt(totalSessionsResult.rows[0].count);
    const presentCount = history.filter(h => h.status === 'present').length;
    const attendancePercentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    for (const record of history) {
      if (record.status === 'present') {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].status === 'present') currentStreak++;
      else break;
    }

    // Monthly breakdown
    const monthlyMap = {};
    for (const record of history) {
      const key = new Date(record.date).toLocaleString('default', { month: 'short' });
      if (!monthlyMap[key]) monthlyMap[key] = { name: key, present: 0, total: 0 };
      monthlyMap[key].total++;
      if (record.status === 'present') monthlyMap[key].present++;
    }
    const monthlyBreakdown = Object.values(monthlyMap).map(m => ({
      ...m,
      percentage: m.total > 0 ? Math.round((m.present / m.total) * 100) : 0
    }));

    return res.json({ analytics: { attendancePercentage, currentStreak, longestStreak, history, monthlyBreakdown } });
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch student analytics' });
  }
});

// PUT /api/mentor/students/:id - Update a student
router.put('/students/:id', requireAuth, requireMentor, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, usn, email, department, batchYear } = req.body;
    await query(
      'UPDATE public.students SET name=$1, usn=$2, email=$3, branch_code=$4, batch=$5 WHERE id=$6',
      [fullName, usn?.toUpperCase(), email?.toLowerCase(), department, batchYear, id]
    );
    await query('UPDATE public.users SET display_name=$1, email=$2 WHERE student_id=$3', [fullName, email?.toLowerCase(), id]);
    return res.json({ success: true, message: 'Student updated' });
  } catch (error) {
    console.error('Error updating student:', error);
    return res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE /api/mentor/students/:id - Remove a student
router.delete('/students/:id', requireAuth, requireMentor, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM public.attendance WHERE student_id = $1', [id]);
    await query('DELETE FROM public.users WHERE student_id = $1', [id]);
    await query('DELETE FROM public.students WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Student removed' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return res.status(500).json({ error: 'Failed to delete student' });
  }
});

// POST /api/mentor/students/:id/reset-password
router.post('/students/:id/reset-password', requireAuth, requireMentor, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const hash = await bcrypt.hash(String(newPassword), 12);
    await query('UPDATE public.users SET password_hash=$1, must_change_password=true WHERE student_id=$2', [hash, id]);
    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
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
    const sessionsResult = await query(`
      SELECT s.*, sub.name as subject_name, sub.code as subject_code
      FROM public.sessions s
      LEFT JOIN public.subjects sub ON s.subject_id = sub.id
      WHERE s.date = $1
    `, [today]);
    
    const todaySessions = [];
    
    for (const session of sessionsResult.rows) {
      const attendanceResult = await query(
        `SELECT a.present, s.name as "fullName", s.usn 
         FROM public.attendance a 
         JOIN public.students s ON a.student_id = s.id 
         WHERE a.session_id = $1`,
        [session.id]
      );
      
      const attendance = attendanceResult.rows;
      todaySessions.push({
        id: session.id,
        topic: session.topic,
        subjectName: session.subject_name || 'Skill Lab',
        subjectCode: session.subject_code || null,
        total: attendance.length,
        present: attendance.filter(a => a.present).length,
        absentStudents: attendance.filter(a => !a.present).map(a => ({
          fullName: a.fullName,
          usn: a.usn
        }))
      });
    }

    // Maintain compatibility for the main 'today' card
    const firstSession = todaySessions[0] || {
      total: 0,
      present: 0,
      topic: 'No session today',
      absentStudents: []
    };

    return res.json({
      stats: {
        totalStudents: parseInt(studentsCount.rows[0].count),
        totalSessions: parseInt(sessionsCount.rows[0].count),
        avgAttendance: 0, 
        today: {
          ...firstSession,
          sessionTopic: firstSession.topic,
          absent: firstSession.total - firstSession.present
        },
        todaySessions
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// SUBJECTS ENDPOINTS
router.get('/subjects', requireAuth, requireMentor, async (req, res) => {
  try {
    const result = await query('SELECT * FROM public.subjects ORDER BY name ASC');
    return res.json({ subjects: result.rows });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.post('/subjects', requireAuth, requireMentor, async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });
    
    const result = await query(
      'INSERT INTO public.subjects (name, code) VALUES ($1, $2) RETURNING *',
      [name, code.toUpperCase()]
    );
    return res.json({ success: true, subject: result.rows[0] });
  } catch (error) {
    console.error('Error adding subject:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Subject code already exists' });
    return res.status(500).json({ error: 'Failed to add subject' });
  }
});

router.delete('/subjects/:id', requireAuth, requireMentor, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM public.subjects WHERE id = $1', [id]);
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// GET /api/mentor/sessions/:date - Get or create a session for a date and subject
router.get('/sessions/:date', requireAuth, requireMentor, async (req, res) => {
  try {
    const { date } = req.params;
    const { subjectId } = req.query;
    const sessionDate = new Date(date).toISOString().split('T')[0];

    let queryText = 'SELECT * FROM public.sessions WHERE date = $1';
    let params = [sessionDate];

    if (subjectId) {
      queryText += ' AND subject_id = $2';
      params.push(subjectId);
    } else {
      queryText += ' AND subject_id IS NULL';
    }

    let sessionResult = await query(queryText, params);
    
    if (sessionResult.rows.length === 0) {
      // For auto-creation, if subjectId is provided, use it
      const insertText = subjectId 
        ? 'INSERT INTO public.sessions (date, topic, month_number, subject_id) VALUES ($1, $2, $3, $4) RETURNING *'
        : 'INSERT INTO public.sessions (date, topic, month_number) VALUES ($1, $2, $3) RETURNING *';
      
      const insertParams = [sessionDate, 'New Session', new Date(date).getMonth() + 1];
      if (subjectId) insertParams.push(subjectId);

      sessionResult = await query(insertText, insertParams);
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

// DELETE /api/mentor/materials/:id
router.delete('/materials/:id', requireAuth, requireMentor, async (req, res) => {
  try {
    await query('DELETE FROM public.materials WHERE id = $1', [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json({ error: 'Failed to delete material' });
  }
});

export default router;
