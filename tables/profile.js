const bcrypt = require('bcrypt');
const pool = require('../db');
const { validText, handleDatabaseError } = require('../utils/api');

const PASSWORD_MAX_BYTES = 72;
const PROFILE_FIELDS = 'id, username, email, role, avatar_url, age, phone, created_at';

const AVATAR_MAX_LENGTH = 100000;

async function publicProfile(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, username, avatar_url, created_at FROM users WHERE id = $1`,
      [req.params.id],
    );
    if (!result.rowCount) return res.status(404).json({ error: 'المستخدم غير موجود.' });
    const posts = await pool.query(
      `SELECT p.id, p.user_id, u.username, u.avatar_url, p.title, p.content, p.created_at, p.updated_at,
         (SELECT COUNT(*)::int FROM reactions r WHERE r.post_id = p.id AND r.type = 'like') AS like_count,
         (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1 AND p.status = 'published' AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC, p.id DESC`,
      [req.params.id],
    );
    return res.json({ user: result.rows[0], posts: posts.rows });
  } catch (error) {
    return handleDatabaseError(res, error, 'تعذر تحميل صفحة المستخدم.');
  }
}

function validAvatarUrl(value) {
  if (value === null || value === undefined || value === '') return true;
  if (typeof value !== 'string' || value.length > AVATAR_MAX_LENGTH) return false;
  // Uploaded avatars arrive as a downscaled JPEG data URL from the client.
  if (/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

async function updateProfile(req, res) {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const avatarUrl = req.body?.avatar_url === '' ? null : req.body?.avatar_url;
  const age = req.body?.age === '' || req.body?.age === null || req.body?.age === undefined ? null : Number(req.body.age);
  const phoneValue = req.body?.phone;
  const phone = typeof phoneValue === 'string' ? phoneValue.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if ('password' in (req.body || {})) {
    return res.status(400).json({ error: 'Change your password from the forgot-password flow' });
  }

  if (!validText(username, 100)) return res.status(400).json({ error: 'username must be 1 to 100 characters' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) return res.status(400).json({ error: 'valid email is required' });
  if (!validAvatarUrl(avatarUrl)) return res.status(400).json({ error: 'avatar_url must be a valid http(s) image URL or an uploaded image' });
  if (phoneValue !== undefined && phoneValue !== null && typeof phoneValue !== 'string') return res.status(400).json({ error: 'phone must be a string' });
  if (age !== null && (!Number.isInteger(age) || age < 13 || age > 120)) return res.status(400).json({ error: 'age must be an integer between 13 and 120' });
  if (phone && (phone.length > 30 || !/^\+?[0-9\s().-]{7,20}$/.test(phone))) return res.status(400).json({ error: 'phone must be a valid phone number' });
  if (password && (password.length < 8 || Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES)) {
    return res.status(400).json({ error: 'password must be at least 8 and no more than 72 UTF-8 bytes' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET username = $1, email = $2, avatar_url = $3, age = $4, phone = $5
       WHERE id = $6 RETURNING ${PROFILE_FIELDS}`,
      [username, email, avatarUrl || null, age, phone || null, req.user.id],
    );
    return result.rowCount ? res.json({ user: result.rows[0] }) : res.status(404).json({ error: 'User not found' });
  } catch (error) { return handleDatabaseError(res, error, 'Could not update profile'); }
}

module.exports = { updateProfile, publicProfile };
