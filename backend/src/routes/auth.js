import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function serializeUser(user) {
  return {
    id: user.id || user._id,
    email: user.email,
    role: user.role,
    name: user.display_name || user.displayName,
    student_id: user.student_id || user.studentId,
    faculty_id: user.faculty_id || user.facultyId,
    profile_image: user.profile_image,
    must_change_password: user.must_change_password || false,
  };
}

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured.');

  return jwt.sign(
    {
      role: user.role,
      studentId: user.student_id || user.studentId,
      facultyId: user.faculty_id || user.facultyId,
    },
    secret,
    {
      subject: (user.id || user._id).toString(),
      expiresIn: '7d',
    }
  );
}

router.post('/login', async (req, res) => {
  const { role, identifier, password } = req.body ?? {};

  if (!role || !identifier || !password) {
    return res.status(400).json({ error: 'Role, identifier, and password are required.' });
  }

  const emailIdentifier = String(identifier).trim().toLowerCase();

  try {
    // SQL query to find user (Case-Insensitive)
    const userResult = await query(
      'SELECT * FROM public.users WHERE LOWER(email) = LOWER($1) AND role = $2',
      [emailIdentifier, role]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const matches = await bcrypt.compare(password, user.password_hash);

    if (!matches) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = signToken(user);
    return res.json({ token, user: serializeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json({ user: serializeUser(req.auth.user) });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body ?? {};
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old and new passwords are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  try {
    const userResult = await query('SELECT * FROM public.users WHERE id = $1', [req.auth.user.id]);
    const user = userResult.rows[0];
    const matches = await bcrypt.compare(oldPassword, user.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE public.users SET password_hash=$1, must_change_password=false WHERE id=$2', [hash, req.auth.user.id]);
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

router.post('/update-profile', requireAuth, async (req, res) => {
  const { displayName, profileImage } = req.body ?? {};
  try {
    await query('UPDATE public.users SET display_name=$1, profile_image=$2 WHERE id=$3', [displayName, profileImage || null, req.auth.user.id]);
    const userResult = await query('SELECT * FROM public.users WHERE id = $1', [req.auth.user.id]);
    return res.json({ user: serializeUser(userResult.rows[0]) });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default router;
