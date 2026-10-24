const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { handleDatabaseError, validId, validText } = require('../utils/api');

const MESSAGE_MAX_LENGTH = 4000;
const CODE_TTL_MINUTES = 15;
const hashAccessKey = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function sendPublicContactMessage(req, res) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : (req.user?.username || '');
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : (req.user?.email || '');
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
  if (!validText(name, 100)) return res.status(400).json({ error: 'اكتب اسمك (حتى 100 حرف).' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return res.status(400).json({ error: 'اكتب بريدًا إلكترونيًا صالحًا.' });
  if (!validText(body, MESSAGE_MAX_LENGTH)) return res.status(400).json({ error: 'اكتب رسالة من 1 إلى 4000 حرف.' });
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existing = req.user
        ? await client.query('SELECT id FROM support_threads WHERE user_id = $1 FOR UPDATE', [req.user.id])
        : await client.query(
          'SELECT id FROM support_threads WHERE user_id IS NULL AND LOWER(guest_email) = $1 ORDER BY id DESC LIMIT 1 FOR UPDATE',
          [email],
        );
      const thread = existing.rowCount
        ? existing.rows[0]
        : (await client.query(
          `INSERT INTO support_threads (user_id, guest_token_hash, guest_name, guest_email)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [req.user?.id || null, hashAccessKey(crypto.randomBytes(32).toString('base64url')), name, email],
        )).rows[0];
      await client.query('UPDATE support_threads SET guest_name = $1, guest_email = $2, updated_at = NOW() WHERE id = $3', [name, email, thread.id]);
      const message = await client.query(
        `INSERT INTO support_messages (thread_id, sender_id, sender_role, body)
         VALUES ($1, $2, $3, $4) RETURNING id, sender_role, body, created_at`,
        [thread.id, req.user?.id || null, req.user ? 'user' : 'guest', body],
      );
      await client.query('COMMIT');
      return res.status(201).json({ message: message.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally { client.release(); }
  } catch (error) {
    return handleDatabaseError(res, error, 'تعذر إرسال رسالتك للأدمن.');
  }
}

async function startResetConversation(req, res) {
  const channel = req.body?.channel || 'email';
  const destinationValue = req.body?.destination ?? req.body?.email;
  const destination = typeof destinationValue === 'string' ? destinationValue.trim() : '';
  if (!['email', 'phone'].includes(channel)) return res.status(400).json({ error: 'طريقة استلام غير صالحة.' });
  if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
    return res.status(400).json({ error: 'اكتب بريدًا إلكترونيًا صالحًا.' });
  }
  if (channel === 'phone' && !/^\+?[0-9\s().-]{7,20}$/.test(destination)) {
    return res.status(400).json({ error: 'اكتب رقم هاتف صالحًا مع مفتاح الدولة.' });
  }

  try {
    const digits = destination.replace(/\D/g, '');
    const found = channel === 'email'
      ? await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [destination.toLowerCase()])
      : await pool.query(
        `SELECT id FROM users
         WHERE regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = $1`,
        [digits],
      );
    const userId = found.rows[0]?.id || null;
    const accessKey = crypto.randomBytes(32).toString('base64url');
    const accessHash = hashAccessKey(accessKey);
    const body = 'نسيت كلمة المرور وأحتاج مساعدة الأدمن لإرسال رمز استعادة الحساب.';
    let thread;

    if (userId) {
      const result = await pool.query(
        `INSERT INTO support_threads (user_id, guest_token_hash)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE
         SET guest_token_hash = EXCLUDED.guest_token_hash, updated_at = NOW()
         RETURNING id`,
        [userId, accessHash],
      );
      thread = result.rows[0];
    } else {
      const result = await pool.query(
        `INSERT INTO support_threads (guest_token_hash) VALUES ($1) RETURNING id`,
        [accessHash],
      );
      thread = result.rows[0];
    }

    await pool.query(
      `INSERT INTO support_messages (thread_id, sender_id, sender_role, body)
       VALUES ($1, $2, $3, $4)`,
      [thread.id, userId, userId ? 'user' : 'guest', body],
    );
    return res.status(202).json({
      accessKey,
      message: 'تم إرسال طلبك للأدمن. احتفظ بهذه الصفحة لمتابعة الرد.',
    });
  } catch (error) {
    return handleDatabaseError(res, error, 'تعذر إرسال طلب استعادة كلمة المرور.');
  }
}

async function resetConversation(req, res) {
  const accessKey = req.params.accessKey;
  if (typeof accessKey !== 'string' || accessKey.length < 32 || accessKey.length > 128) {
    return res.status(404).json({ error: 'المحادثة غير موجودة.' });
  }
  try {
    const thread = await pool.query(
      `SELECT id FROM support_threads WHERE guest_token_hash = $1`,
      [hashAccessKey(accessKey)],
    );
    if (!thread.rowCount) return res.status(404).json({ error: 'المحادثة غير موجودة.' });
    const result = await pool.query(
      `SELECT id, sender_role, body, created_at
       FROM support_messages WHERE thread_id = $1 ORDER BY id`,
      [thread.rows[0].id],
    );
    return res.json({ messages: result.rows });
  } catch (error) {
    return handleDatabaseError(res, error, 'تعذر تحميل رسائل الاستعادة.');
  }
}

async function userMessages(req, res) {
  try {
    const result = await pool.query(
      `SELECT id FROM support_threads WHERE user_id = $1 ORDER BY updated_at DESC, id DESC LIMIT 1`,
      [req.user.id],
    );
    if (!result.rowCount) return res.json({ threadId: null, messages: [] });
    const threadId = result.rows[0].id;
    const messages = await pool.query(
      `SELECT id, sender_role, body, created_at
       FROM support_messages WHERE thread_id = $1 ORDER BY id`,
      [threadId],
    );
    return res.json({ threadId, messages: messages.rows });
  } catch (error) {
    return handleDatabaseError(res, error, 'تعذر تحميل الرسائل.');
  }
}

async function sendUserMessage(req, res) {
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
  if (!validText(body, MESSAGE_MAX_LENGTH)) return res.status(400).json({ error: 'اكتب رسالة من 1 إلى 4000 حرف.' });
  try {
    const threadResult = await pool.query(
      `INSERT INTO support_threads (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      [req.user.id],
    );
    const threadId = threadResult.rows[0].id;
    const result = await pool.query(
      `INSERT INTO support_messages (thread_id, sender_id, sender_role, body)
       VALUES ($1, $2, 'user', $3)
       RETURNING id, sender_role, body, created_at`,
      [threadId, req.user.id, body],
    );
    await pool.query('UPDATE support_threads SET updated_at = NOW() WHERE id = $1', [threadId]);
    return res.status(201).json({ threadId, message: result.rows[0] });
  } catch (error) {
    return handleDatabaseError(res, error, 'تعذر إرسال الرسالة.');
  }
}

async function adminThreads(_req, res) {
  try {
    const result = await pool.query(
      `SELECT t.id, t.user_id, COALESCE(u.username, t.guest_name) AS username,
         COALESCE(u.email, t.guest_email) AS email, u.avatar_url, t.updated_at,
         COALESCE(u.id, (SELECT matched.id FROM users matched WHERE LOWER(matched.email) = LOWER(t.guest_email) ORDER BY matched.id LIMIT 1)) AS reset_user_id,
         (SELECT COUNT(*)::int FROM support_messages m WHERE m.thread_id = t.id
           AND m.sender_role IN ('user', 'guest') AND (t.admin_last_read_at IS NULL OR m.created_at > t.admin_last_read_at)) AS unread_count,
         (SELECT body FROM support_messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS latest_message
       FROM support_threads t LEFT JOIN users u ON u.id = t.user_id
       ORDER BY t.updated_at DESC, t.id DESC`,
    );
    return res.json({ threads: result.rows });
  } catch (error) {
    return handleDatabaseError(res, error, 'تعذر تحميل صندوق الرسائل.');
  }
}

async function publicContact(_req, res) {
  try {
    const result = await pool.query(
      `SELECT username, email, phone, avatar_url FROM users WHERE role = 'admin' ORDER BY id LIMIT 1`,
    );
    if (!result.rowCount) return res.json({ contact: null });
    const { username, email, phone, avatar_url } = result.rows[0];
    return res.json({ contact: { username, email, phone, avatar_url } });
  } catch (error) {
    return handleDatabaseError(res, error, 'تعذر تحميل بيانات التواصل.');
  }
}

async function adminThreadMessages(req, res) {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'id must be a positive integer' });
  try {
    const result = await pool.query(
      `SELECT m.id, m.sender_role, m.body, m.created_at
       FROM support_messages m JOIN support_threads t ON t.id = m.thread_id
       WHERE t.id = $1 ORDER BY m.id`,
      [req.params.id],
    );
    await pool.query('UPDATE support_threads SET admin_last_read_at = NOW() WHERE id = $1', [req.params.id]);
    return res.json({ messages: result.rows });
  } catch (error) {
    return handleDatabaseError(res, error, 'تعذر تحميل المحادثة.');
  }
}

async function deleteAdminThread(req, res) {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'id must be a positive integer' });
  try {
    const result = await pool.query('DELETE FROM support_threads WHERE id = $1 RETURNING id', [req.params.id]);
    return result.rowCount ? res.json({ message: 'تم حذف المحادثة.' }) : res.status(404).json({ error: 'المحادثة غير موجودة.' });
  } catch (error) { return handleDatabaseError(res, error, 'تعذر حذف المحادثة.'); }
}

async function deleteAdminMessage(req, res) {
  if (!validId(req.params.id) || !validId(req.params.messageId)) return res.status(400).json({ error: 'id must be a positive integer' });
  try {
    const result = await pool.query(
      'DELETE FROM support_messages WHERE id = $1 AND thread_id = $2 RETURNING id',
      [req.params.messageId, req.params.id],
    );
    return result.rowCount ? res.json({ message: 'تم حذف الرسالة.' }) : res.status(404).json({ error: 'الرسالة غير موجودة.' });
  } catch (error) { return handleDatabaseError(res, error, 'تعذر حذف الرسالة.'); }
}

async function sendAdminMessage(req, res) {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'id must be a positive integer' });
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
  if (!validText(body, MESSAGE_MAX_LENGTH)) return res.status(400).json({ error: 'اكتب رسالة من 1 إلى 4000 حرف.' });
  try {
    const result = await pool.query(
      `INSERT INTO support_messages (thread_id, sender_id, sender_role, body)
       SELECT id, $2, 'admin', $3 FROM support_threads WHERE id = $1
       RETURNING id, sender_role, body, created_at`,
      [req.params.id, req.user.id, body],
    );
    if (!result.rowCount) return res.status(404).json({ error: 'المحادثة غير موجودة.' });
    await pool.query('UPDATE support_threads SET updated_at = NOW() WHERE id = $1', [req.params.id]);
    return res.status(201).json({ message: result.rows[0] });
  } catch (error) {
    return handleDatabaseError(res, error, 'تعذر إرسال الرد.');
  }
}

async function sendResetCode(req, res) {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'id must be a positive integer' });
  try {
    const thread = await pool.query(
      `SELECT t.id, COALESCE(t.user_id, (SELECT u.id FROM users u WHERE LOWER(u.email) = LOWER(t.guest_email) ORDER BY u.id LIMIT 1)) AS user_id
       FROM support_threads t WHERE t.id = $1`,
      [req.params.id],
    );
    if (!thread.rowCount) return res.status(404).json({ error: 'المحادثة غير موجودة.' });
    if (!thread.rows[0].user_id) return res.status(400).json({ error: 'لا يوجد حساب مسجل بهذا البريد الإلكتروني.' });

    const account = await pool.query('SELECT username FROM users WHERE id = $1', [thread.rows[0].user_id]);
    if (!account.rowCount) return res.status(404).json({ error: 'الحساب غير موجود.' });
    const temporaryPassword = account.rows[0].username;
    if (Buffer.byteLength(temporaryPassword, 'utf8') > 72) return res.status(400).json({ error: 'اسم المستخدم أطول من الحد المسموح لكلمة المرور المؤقتة.' });
    await pool.query('UPDATE support_threads SET user_id = $1 WHERE id = $2 AND user_id IS NULL', [thread.rows[0].user_id, req.params.id]);
    const passwordHash = Buffer.from(await bcrypt.hash(temporaryPassword, 10), 'utf8');
    await pool.query('UPDATE users SET password = $1, must_change_password = TRUE WHERE id = $2', [passwordHash, thread.rows[0].user_id]);
    const result = await pool.query(
      `INSERT INTO support_messages (thread_id, sender_id, sender_role, body)
       VALUES ($1, $2, 'admin', $3)
       RETURNING id, sender_role, body, created_at`,
      [req.params.id, req.user.id, `كلمة المرور المؤقتة للدخول: ${temporaryPassword}\nسجّل الدخول بها ثم غيّرها فورًا من حسابك.`],
    );
    await pool.query('UPDATE support_threads SET updated_at = NOW() WHERE id = $1', [req.params.id]);
    return res.status(201).json({ message: result.rows[0] });
  } catch (error) {
    return handleDatabaseError(res, error, 'تعذر إنشاء رمز الاستعادة.');
  }
}

module.exports = {
  startResetConversation,
  sendPublicContactMessage,
  resetConversation,
  userMessages,
  sendUserMessage,
  adminThreads,
  publicContact,
  adminThreadMessages,
  sendAdminMessage,
  deleteAdminThread,
  deleteAdminMessage,
  sendResetCode,
};
