import express from 'express';
import pool, { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireSubjectAccess } from '../middleware/subjectAuth.js';

const router = express.Router();

// Middleware: Ensure user is mentor
function ensureMentor(req, res, next) {
  if (req.auth.user.role !== 'mentor') {
    return res.status(403).json({ error: 'Only mentors can access this' });
  }
  next();
}

/**
 * PUT /api/attendance/update/:id
 * Bulk update attendance for a specific session with audit trail.
 */
router.put('/update/:id', requireAuth, ensureMentor, requireSubjectAccess, async (req, res) => {
  const { id: sessionIdStr } = req.params;
  const { attendance, remarks } = req.body;
  const facultyName = req.auth.user.displayName;
  const sessionId = parseInt(sessionIdStr);

  if (isNaN(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  if (!attendance || !Array.isArray(attendance)) {
    return res.status(400).json({ error: 'Attendance records required' });
  }

  console.log(`[AttendanceMgmt] Bulk update starting for session ${sessionId} by ${facultyName}`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const record of attendance) {
      const { studentId, isPresent } = record;

      if (!studentId) continue;

      // 1. Get old status for audit
      const oldStatusRes = await client.query(
        'SELECT present FROM public.attendance WHERE student_id = $1 AND session_id = $2',
        [studentId, sessionId]
      );
      const oldStatus = oldStatusRes.rows.length > 0 ? oldStatusRes.rows[0].present : null;

      // 2. Insert or Update attendance
      // Use COALESCE(version, 0) to handle existing rows with NULL versions
      await client.query(
        `INSERT INTO public.attendance (student_id, session_id, present, marked_by, version)
         VALUES ($1, $2, $3, $4, 1)
         ON CONFLICT (student_id, session_id) 
         DO UPDATE SET 
           present = $3, 
           marked_by = $4, 
           version = COALESCE(public.attendance.version, 0) + 1,
           last_edited_by = $4`,
        [studentId, sessionId, isPresent, facultyName]
      );

      // 3. Create Audit Log if status changed
      if (oldStatus !== isPresent) {
        await client.query(
          `INSERT INTO public.attendance_audit 
           (session_id, student_id, previous_status, new_status, changed_by, remarks)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [sessionId, studentId, oldStatus, isPresent, facultyName, remarks || 'Manual update']
        );
      }
    }

    // 4. Update session-level metadata
    await client.query(
      'UPDATE public.sessions SET remarks = $1, last_edited_at = CURRENT_TIMESTAMP WHERE id = $2',
      [remarks, sessionId]
    );

    await client.query('COMMIT');
    console.log(`[AttendanceMgmt] Bulk update successful for session ${sessionId}`);
    res.json({ success: true, message: 'Attendance records synchronized' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[AttendanceMgmt] CRITICAL FAILURE:', error);
    res.status(500).json({ 
      error: 'Failed to update attendance records', 
      details: error.message,
      code: error.code 
    });
  } finally {
    client.release();
  }
});

/**
 * 2. PATCH /api/attendance/student/:attendanceId
 * Single student status toggle
 */
router.patch('/student/:attendanceId', async (req, res) => {
  // Implementation for single toggle if needed, usually bulk is used
  res.status(501).json({ error: 'Not implemented. Use bulk update instead.' });
});

/**
 * 3. DELETE /api/attendance/session/:id
 * Delete a session and all its records
 */
router.delete('/session/:id', requireSubjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Audit before delete? (Optional)
    
    await query('DELETE FROM public.attendance WHERE session_id = $1', [id]);
    await query('DELETE FROM public.sessions WHERE id = $1', [id]);
    
    return res.json({ success: true, message: 'Session purged successfully.' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return res.status(500).json({ error: 'System failure during session purge.' });
  }
});

/**
 * 4. GET /api/attendance/history/:subjectId
 * Get history of sessions for a subject
 */
router.get('/history/:subjectId', requireSubjectAccess, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const result = await query(
      `SELECT s.*, 
              COUNT(a.id) as total,
              COUNT(a.id) FILTER (WHERE a.present = true) as present
       FROM public.sessions s
       LEFT JOIN public.attendance a ON s.id = a.session_id
       WHERE s.subject_id = $1
       GROUP BY s.id
       ORDER BY s.date DESC`,
      [subjectId]
    );
    return res.json({ history: result.rows });
  } catch (error) {
    console.error('Error fetching subject history:', error);
    return res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

/**
 * 5. GET /api/attendance/audit-logs/:sessionId
 * View change history for a session
 */
router.get('/audit-logs/:sessionId', requireSubjectAccess, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await query(
      `SELECT al.*, st.name as student_name, st.usn
       FROM public.attendance_audit al
       JOIN public.students st ON al.student_id = st.id
       WHERE al.session_id = $1
       ORDER BY al.changed_at DESC`,
      [sessionId]
    );
    return res.json({ logs: result.rows });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ error: 'Failed to fetch audit trails.' });
  }
});

export default router;
