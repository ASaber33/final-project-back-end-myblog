const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../db');
const { handleDatabaseError } = require('../utils/api');
const { startResetConversation } = require('./messages');

const PASSWORD_MAX_BYTES = 72;

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');
const validPassword = (value) => typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value, 'utf8') <= PASSWORD_MAX_BYTES;

async function resetPassword(req, res) {
  const channel = req.body?.channel || 'email';
  if (!['email', 'phone'].includes(channel)) return res.status(400).json({ error: 'طريقة استلام غير صالحة.' });
  const destinationValue = req.body?.destination ?? req.body?.email;
  const destination = typeof destinationValue === 'string' ? destinationValue.trim() : '';
  const lookup = channel === 'phone' ? destination.replace(/\D/g, '') : destination.toLowerCase();
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  const password = req.body?.password;

  if (!lookup || !/^\d{6}$/.test(code)) return res.status(400).json({ error: 'بيانات الاستعادة والكود مطلوبان.' });
  if (!validPassword(password)) return res.status(400).json({ error: 'كلمة المرور لازم 8 أحرف على الأقل.' });

  try {
    const found = channel === 'phone'
      ? await pool.query(
        `SELECT r.id FROM password_resets r
         JOIN users u ON u.id = r.user_id
         WHERE regexp_replace(COALESCE(u.phone, ''), '[^0-9]', '', 'g') = $1
           AND r.code_hash = $2 AND r.used_at IS NULL AND r.expires_at > NOW()
         ORDER BY r.id DESC LIMIT 1`,
        [lookup, hashCode(code)],
      )
      : await pool.query(
        `SELECT r.id FROM password_resets r
         JOIN users u ON u.id = r.user_id
         WHERE LOWER(u.email) = $1 AND r.code_hash = $2 AND r.used_at IS NULL AND r.expires_at > NOW()
         ORDER BY r.id DESC LIMIT 1`,
        [lookup, hashCode(code)],
      );
    if (!found.rowCount) return res.status(400).json({ error: 'الكود غلط أو انتهت صلاحيته.' });

    const resetId = found.rows[0].id;
    const hash = Buffer.from(await bcrypt.hash(password, 10), 'utf8');
    await pool.query(
      `UPDATE users SET password = $1 WHERE id = (SELECT user_id FROM password_resets WHERE id = $2)`,
      [hash, resetId],
    );
    await pool.query('UPDATE password_resets SET used_at = NOW() WHERE id = $1', [resetId]);
    return res.json({ message: 'كلمة المرور اتغيّرت. تقدر تسجل دخول بالجديدة.' });
  } catch (error) {
    return handleDatabaseError(res, error, 'تعذر تغيير كلمة المرور.');
  }
}

module.exports = { requestReset: startResetConversation, resetPassword };
