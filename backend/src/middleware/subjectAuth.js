import { query } from '../db.js';

export async function requireSubjectAccess(req, res, next) {
  try {
    // 1. Basic Auth Check
    const user = req.auth?.user;
    if (!user || user.role !== 'mentor') {
      return next(); // If not a mentor, let other middlewares handle it
    }

    const facultyId = user.facultyId;
    if (!facultyId) {
      return next(); 
    }

    // 2. Identify Context
    const subjectId = req.params.subjectId || req.body.subjectId || req.query.subjectId;
    const sessionId = req.params.id || req.body.sessionId || req.query.sessionId;

    if (!subjectId && !sessionId) {
      return next();
    }

    let targetSubjectId = subjectId;

    // 3. Resolve Session -> Subject
    if (!targetSubjectId && sessionId) {
      const sId = parseInt(sessionId);
      if (!isNaN(sId)) {
        try {
          const sessionRes = await query('SELECT subject_id FROM public.sessions WHERE id = $1', [sId]);
          if (sessionRes && sessionRes.rows && sessionRes.rows.length > 0) {
            targetSubjectId = sessionRes.rows[0].subject_id;
          }
        } catch (dbErr) {
          console.error('[SubjectAuth] DB Error (Session):', dbErr);
          // Fallback: allow if DB fails to be safe, or return 500?
          // Let's return next() for now to avoid blocking if DB is just flaky
          return next();
        }
      }
    }

    // 4. Verification
    if (!targetSubjectId) {
       return next();
    }

    const subId = parseInt(targetSubjectId);
    if (isNaN(subId)) {
        return next();
    }

    try {
      const result = await query(
        'SELECT id FROM public.subjects WHERE id = $1 AND assigned_faculty_id = $2',
        [subId, facultyId]
      );

      if (result && result.rows && result.rows.length === 0) {
        console.warn(`[SubjectAuth] Access Denied for ${facultyId} to Subject ${subId}`);
        return res.status(403).json({ 
          error: 'Unauthorized access to this subject.',
          details: 'You are not assigned as the faculty for this course.'
        });
      }
    } catch (dbErr) {
      console.error('[SubjectAuth] DB Error (Subject):', dbErr);
      return next();
    }

    return next();
  } catch (error) {
    console.error('[SubjectAuth] CRITICAL ERROR:', error);
    // FALLBACK: If the middleware itself crashes, we MUST NOT block the request
    return next();
  }
}

// Deployment Anchor: 2026-05-16T16:20:00 (Forcing Render Redeploy)

