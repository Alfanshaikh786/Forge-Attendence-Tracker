import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Middleware: Ensure user is student
function ensureStudent(req, res, next) {
  if (req.auth.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can access this' });
  }
  next();
}

// GET /api/student/me - Get student's own record
router.get('/me', requireAuth, ensureStudent, async (req, res) => {
  try {
    const studentResult = await query(
      'SELECT s.* FROM public.students s WHERE s.id = $1',
      [req.auth.user.studentId]
    );
    const student = studentResult.rows[0];

    if (!student) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    return res.json({ student });
  } catch (error) {
    console.error('Error fetching student record:', error);
    return res.status(500).json({ error: 'Failed to fetch student record' });
  }
});

// GET /api/student/attendance-stats - Get attendance statistics
router.get('/attendance-stats', requireAuth, ensureStudent, async (req, res) => {
  try {
    // 1. Get Subject-wise breakdown (This is the source of truth)
    const subjectStatsResult = await query(`
      SELECT 
        sub.id,
        sub.name,
        sub.code,
        COUNT(s.id) FILTER (WHERE s.date <= CURRENT_DATE OR a.id IS NOT NULL) as total,
        COUNT(a.id) FILTER (WHERE a.present = true) as present
      FROM public.subjects sub
      LEFT JOIN public.sessions s ON s.subject_id = sub.id
      LEFT JOIN public.attendance a ON a.session_id = s.id AND a.student_id = $1
      GROUP BY sub.id, sub.name, sub.code
      ORDER BY sub.name ASC
    `, [req.auth.user.studentId]);

    const subjects = subjectStatsResult.rows.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      total: parseInt(r.total),
      present: parseInt(r.present),
      percentage: parseInt(r.total) > 0 ? Math.round((parseInt(r.present) / parseInt(r.total)) * 100) : 0
    }));

    // 2. Aggregate stats from subjects
    const totalSessions = subjects.reduce((sum, s) => sum + s.total, 0);
    const sessionsAttended = subjects.reduce((sum, s) => sum + s.present, 0);
    const sessionsMissed = totalSessions - sessionsAttended;
    const attendancePercentage = totalSessions > 0 ? Math.round((sessionsAttended / totalSessions) * 100) : 0;

    return res.json({
      stats: {
        attendancePercentage,
        sessionsMissed,
        sessionsAttended,
        currentStreak: 0, 
        totalSessions,
        subjects
      },
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return res.status(500).json({ error: 'Failed to fetch attendance stats' });
  }
});

// GET /api/student/attendance-history
router.get('/attendance-history', requireAuth, ensureStudent, async (req, res) => {
  try {
    const studentId = req.auth.user.studentId;
    const historyResult = await query(
      `SELECT a.*, s.date, s.topic, s.duration_hours, sub.name as subject_name, sub.code as subject_code
       FROM public.attendance a 
       JOIN public.sessions s ON a.session_id = s.id 
       LEFT JOIN public.subjects sub ON s.subject_id = sub.id
       WHERE a.student_id = $1 
       ORDER BY s.date DESC`,
      [studentId]
    );

    return res.json({
      history: historyResult.rows.map(r => ({
        date: r.date,
        topic: r.topic,
        subject: r.subject_name ? `${r.subject_name} (${r.subject_code})` : 'Skill Lab',
        status: r.present ? 'present' : 'absent',
        duration: r.duration_hours,
        markedAt: r.marked_at
      }))
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/student/upcoming-session
router.get('/upcoming-session', requireAuth, ensureStudent, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sessionResult = await query(
      'SELECT * FROM public.sessions WHERE date >= $1 ORDER BY date ASC LIMIT 1',
      [today]
    );
    return res.json({ session: sessionResult.rows[0] || null });
  } catch (error) {
    console.error('Error fetching upcoming session:', error);
    return res.status(500).json({ error: 'Failed to fetch upcoming session' });
  }
});

// GET /api/student/heatmap
router.get('/heatmap', requireAuth, ensureStudent, async (req, res) => {
  try {
    const studentId = req.auth.user.studentId;
    const heatmapResult = await query(
      `SELECT s.date, a.present 
       FROM public.sessions s
       LEFT JOIN public.attendance a ON a.session_id = s.id AND a.student_id = $1
       ORDER BY s.date ASC`,
      [studentId]
    );
    
    // Map to { date: 'YYYY-MM-DD', status: 'present'|'absent'|'none' }
    const heatmap = heatmapResult.rows.map(r => ({
      date: r.date,
      status: r.present === true ? 'present' : r.present === false ? 'absent' : 'none'
    }));

    return res.json({ heatmap });
  } catch (error) {
    console.error('Error fetching heatmap:', error);
    return res.status(500).json({ error: 'Failed to fetch heatmap' });
  }
});

// GET /api/student/materials
router.get('/materials', requireAuth, ensureStudent, async (req, res) => {
  try {
    const materialsResult = await query(
      `SELECT m.*, s.date as "sessionDate", s.topic as "sessionTopic"
       FROM public.materials m
       JOIN public.sessions s ON m.session_id = s.id
       ORDER BY s.date DESC`
    );
    return res.json({ materials: materialsResult.rows });
  } catch (error) {
    console.error('Error fetching student materials:', error);
    return res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// NOTIFICATIONS
router.get('/notifications', requireAuth, ensureStudent, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM public.notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.auth.user.id]
    );
    return res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/notifications/:id/read', requireAuth, ensureStudent, async (req, res) => {
  try {
    await query(
      'UPDATE public.notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.auth.user.id]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    return res.status(500).json({ error: 'Failed to mark as read' });
  }
});

router.post('/notifications/read-all', requireAuth, ensureStudent, async (req, res) => {
  try {
    await query(
      'UPDATE public.notifications SET is_read = true WHERE user_id = $1',
      [req.auth.user.id]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking all read:', error);
    return res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// GET /api/student/subject/:subjectCode - Get subject details & summary
router.get('/subject/:subjectCode', requireAuth, ensureStudent, async (req, res) => {
  try {
    const { subjectCode } = req.params;
    const studentId = req.auth.user.studentId;

    // 1. Get Subject info and faculty
    const subjectResult = await query(`
      SELECT sub.*, u.display_name as faculty_name
      FROM public.subjects sub
      LEFT JOIN public.users u ON sub.assigned_faculty_id = u.faculty_id
      WHERE sub.code = $1
    `, [subjectCode]);

    if (subjectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const subject = subjectResult.rows[0];

    // 2. Get real attendance counts
    const statsResult = await query(`
      SELECT 
        COUNT(DISTINCT s.id) as total,
        COUNT(DISTINCT a.id) FILTER (WHERE a.present = true) as present,
        COUNT(DISTINCT a.id) FILTER (WHERE a.present = false) as absent
      FROM public.sessions s
      LEFT JOIN public.attendance a ON a.session_id = s.id AND a.student_id = $1
      WHERE s.subject_id = $2 
        AND (s.date <= CURRENT_DATE OR a.id IS NOT NULL)
    `, [studentId, subject.id]);

    const stats = statsResult.rows[0];
    const total = parseInt(stats.total);
    const present = parseInt(stats.present);
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return res.json({
      subject: {
        ...subject,
        percentage,
        total,
        present,
        absent: parseInt(stats.absent)
      }
    });
  } catch (error) {
    console.error('Error fetching student subject details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/student/subject/:subjectCode/attendance - Full history for this subject
router.get('/subject/:subjectCode/attendance', requireAuth, ensureStudent, async (req, res) => {
  try {
    const { subjectCode } = req.params;
    const studentId = req.auth.user.studentId;

    const result = await query(`
      SELECT s.date, s.topic, a.present, a.marked_at
      FROM public.sessions s
      JOIN public.subjects sub ON s.subject_id = sub.id
      LEFT JOIN public.attendance a ON a.session_id = s.id AND a.student_id = $1
      WHERE sub.code = $2 AND s.date <= CURRENT_DATE
      ORDER BY s.date DESC
    `, [studentId, subjectCode]);

    return res.json({ history: result.rows });
  } catch (error) {
    console.error('Error fetching subject attendance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/student/subject/:subjectCode/analytics - Trend data
router.get('/subject/:subjectCode/analytics', requireAuth, ensureStudent, async (req, res) => {
  try {
    const { subjectCode } = req.params;
    const studentId = req.auth.user.studentId;

    const result = await query(`
      WITH session_history AS (
        SELECT 
          s.date,
          CASE WHEN a.present THEN 1 ELSE 0 END as was_present,
          ROW_NUMBER() OVER (ORDER BY s.date) as session_num
        FROM public.sessions s
        JOIN public.subjects sub ON s.subject_id = sub.id
        LEFT JOIN public.attendance a ON a.session_id = s.id AND a.student_id = $1
        WHERE sub.code = $2 AND s.date <= CURRENT_DATE
      )
      SELECT 
        date,
        ROUND((SUM(was_present) OVER (ORDER BY date)::float / session_num) * 100) as rolling_avg
      FROM session_history
      ORDER BY date ASC
    `, [studentId, subjectCode]);

    return res.json({ trend: result.rows });
  } catch (error) {
    console.error('Error fetching subject analytics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/student/subject/:subjectCode/heatmap - Daily status
router.get('/subject/:subjectCode/heatmap', requireAuth, ensureStudent, async (req, res) => {
  try {
    const { subjectCode } = req.params;
    const studentId = req.auth.user.studentId;

    const result = await query(`
      SELECT s.date, a.present
      FROM public.sessions s
      JOIN public.subjects sub ON s.subject_id = sub.id
      LEFT JOIN public.attendance a ON a.session_id = s.id AND a.student_id = $1
      WHERE sub.code = $2
      ORDER BY s.date ASC
    `, [studentId, subjectCode]);

    const heatmap = result.rows.map(r => ({
      date: r.date,
      status: r.present === true ? 'present' : r.present === false ? 'absent' : 'none'
    }));

    return res.json({ heatmap });
  } catch (error) {
    console.error('Error fetching subject heatmap:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/student/subject/:subjectCode/upcoming
router.get('/subject/:subjectCode/upcoming', requireAuth, ensureStudent, async (req, res) => {
  try {
    const { subjectCode } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    const result = await query(`
      SELECT s.*, u.display_name as faculty_name, sub.name as subject_name
      FROM public.sessions s
      JOIN public.subjects sub ON s.subject_id = sub.id
      LEFT JOIN public.users u ON sub.assigned_faculty_id = u.faculty_id
      WHERE sub.code = $1 AND s.date >= $2
      ORDER BY s.date ASC
      LIMIT 1
    `, [subjectCode, today]);

    return res.json({ upcoming: result.rows[0] || null });
  } catch (error) {
    console.error('Error fetching upcoming session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
