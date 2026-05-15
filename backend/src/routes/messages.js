import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/messages/conversations - Get all conversations for current user
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.user.id;
    
    const conversationsResult = await query(
      `SELECT c.*, cp.unread_count, 
              (SELECT json_agg(json_build_object('id', u.id, 'displayName', u.display_name, 'role', u.role))
               FROM public.conversation_participants cp2
               JOIN public.users u ON cp2.user_id = u.id
               WHERE cp2.conversation_id = c.id) as participants
       FROM public.conversations c
       JOIN public.conversation_participants cp ON c.id = cp.conversation_id
       WHERE cp.user_id = $1
       ORDER BY c.last_message_at DESC`,
      [userId]
    );

    return res.json({ conversations: conversationsResult.rows });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/messages/mentors - Get list of mentors
router.get('/mentors', requireAuth, async (req, res) => {
  try {
    const mentorsResult = await query(
      "SELECT id, display_name as \"displayName\", email, role FROM public.users WHERE role = 'mentor'"
    );
    return res.json({ mentors: mentorsResult.rows });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return res.status(500).json({ error: 'Failed to fetch mentors' });
  }
});

// GET /api/messages/students - Get list of students
router.get('/students', requireAuth, async (req, res) => {
  try {
    const studentsResult = await query(
      "SELECT id, display_name as \"displayName\", email, role FROM public.users WHERE role = 'student'"
    );
    return res.json({ students: studentsResult.rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
});

export default router;
