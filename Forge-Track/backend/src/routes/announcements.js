import express from 'express';
import { query } from '../db.js';
import { requireAuth, requireMentor } from '../middleware/auth.js';

const router = express.Router();

// GET /api/announcements - Get all active announcements
router.get('/', requireAuth, async (req, res) => {
  try {
    const announcementsResult = await query(
      `SELECT a.*, u.display_name as "createdBy_name", u.email as "createdBy_email"
       FROM public.announcements a
       JOIN public.users u ON a.created_by = u.id
       WHERE a.is_active = true
       ORDER BY a.is_pinned DESC, a.created_at DESC`,
      []
    );

    const announcements = announcementsResult.rows.map(ann => ({
      ...ann,
      _id: ann.id,
      createdBy: {
        displayName: ann.createdBy_name,
        email: ann.createdBy_email
      }
    }));

    return res.json({ announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// GET /api/announcements/:id - Get single announcement
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT a.*, u.display_name as "createdBy_name"
       FROM public.announcements a
       JOIN public.users u ON a.created_by = u.id
       WHERE a.id = $1 AND a.is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const ann = result.rows[0];
    return res.json({ 
      announcement: {
        ...ann,
        _id: ann.id,
        createdBy: { displayName: ann.createdBy_name }
      } 
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// POST /api/announcements - Create new announcement (mentor only)
router.post('/', requireAuth, requireMentor, async (req, res) => {
  try {
    const { title, content, isPinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await query(
      `INSERT INTO public.announcements (title, content, created_by, is_pinned) 
       VALUES ($1, $2, $3, $4) RETURNING id as "_id", *`,
      [title.trim(), content.trim(), req.auth.user.id, isPinned || false]
    );

    const announcement = result.rows[0];

    // Simple notification for all students
    const students = await query('SELECT id as user_id FROM public.users WHERE role = $1', ['student']);
    for (const student of students.rows) {
      await query(
        'INSERT INTO public.notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
        [student.user_id, 'New Announcement', title, 'info']
      );
    }

    return res.status(201).json({ announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// DELETE /api/announcements/:id - Delete announcement
router.delete('/:id', requireAuth, requireMentor, async (req, res) => {
  try {
    await query('UPDATE public.announcements SET is_active = false WHERE id = $1', [req.params.id]);
    return res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

export default router;
