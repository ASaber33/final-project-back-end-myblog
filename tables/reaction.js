const pool = require('../db');
const { handleDatabaseError } = require('../utils/api');

const VALID_TYPES = ['like', 'dislike'];

async function summarize(postId, userId) {
  const counts = await pool.query(
    "SELECT COUNT(*) FILTER (WHERE type = 'like')::int AS likes, COUNT(*) FILTER (WHERE type = 'dislike')::int AS dislikes FROM reactions WHERE post_id = $1",
    [postId],
  );
  let myReaction = null;
  if (userId) {
    const mine = await pool.query('SELECT type FROM reactions WHERE post_id = $1 AND user_id = $2 ORDER BY id LIMIT 1', [postId, userId]);
    myReaction = mine.rows[0]?.type || null;
  }
  return { reaction: myReaction, likes: counts.rows[0].likes, dislikes: counts.rows[0].dislikes };
}

async function countReactions(req, res) {
  try {
    const post = await pool.query('SELECT 1 FROM posts WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
    if (!post.rowCount) return res.status(404).json({ error: 'Post not found' });
    const result = await pool.query('SELECT type, COUNT(*)::int AS count FROM reactions WHERE post_id = $1 GROUP BY type ORDER BY type', [req.params.id]);
    return res.json({ reactions: result.rows });
  } catch (error) { return handleDatabaseError(res, error, 'Could not read reactions'); }
}

async function myReaction(req, res) {
  try {
    return res.json(await summarize(req.params.id, req.user.id));
  } catch (error) { return handleDatabaseError(res, error, 'Could not read reaction'); }
}

// A repeated like toggles the reaction off, which is what the feed button does.
async function setReaction(req, res) {
  const type = req.body?.type ?? 'like';
  const toggle = req.body?.toggle !== false;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'type must be like or dislike' });
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const post = await client.query('SELECT 1 FROM posts WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
    if (!post.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Post not found' }); }
    await client.query('SELECT pg_advisory_xact_lock($1::integer, $2::integer)', [Number(req.params.id), Number(req.user.id)]);
    const existing = await client.query(
      'SELECT id, type FROM reactions WHERE post_id = $1 AND user_id = $2 ORDER BY id LIMIT 1 FOR UPDATE',
      [req.params.id, req.user.id],
    );
    if (existing.rowCount && existing.rows[0].type === type && toggle) {
      await client.query('DELETE FROM reactions WHERE post_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    } else if (existing.rowCount) {
      await client.query('UPDATE reactions SET type = $1 WHERE post_id = $2 AND user_id = $3', [type, req.params.id, req.user.id]);
    } else {
      await client.query('INSERT INTO reactions (post_id, user_id, type) VALUES ($1, $2, $3)', [req.params.id, req.user.id, type]);
    }
    await client.query('COMMIT');
    return res.json(await summarize(req.params.id, req.user.id));
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    return handleDatabaseError(res, error, 'Could not save reaction');
  } finally { client?.release(); }
}

async function deleteOwnReaction(req, res) {
  try {
    const result = await pool.query('DELETE FROM reactions WHERE post_id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    const summary = await summarize(req.params.id, req.user.id);
    return res.json({ message: result.rowCount ? 'Reaction removed' : 'There was no reaction to remove', ...summary });
  } catch (error) { return handleDatabaseError(res, error, 'Could not delete reaction'); }
}

async function listReactions(_req, res) {
  try {
    const result = await pool.query('SELECT * FROM reactions ORDER BY created_at DESC, id DESC');
    return res.json({ reactions: result.rows });
  } catch (error) { return handleDatabaseError(res, error, 'Could not read reactions'); }
}

async function getReaction(req, res) {
  try {
    const result = await pool.query('SELECT * FROM reactions WHERE id = $1', [req.params.id]);
    return result.rowCount ? res.json({ reaction: result.rows[0] }) : res.status(404).json({ error: 'Reaction not found' });
  } catch (error) { return handleDatabaseError(res, error, 'Could not read reaction'); }
}

async function updateReaction(req, res) {
  const type = req.body?.type;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'type must be like or dislike' });
  try {
    const result = await pool.query('UPDATE reactions SET type = $1 WHERE id = $2 RETURNING *', [type, req.params.id]);
    return result.rowCount ? res.json({ reaction: result.rows[0] }) : res.status(404).json({ error: 'Reaction not found' });
  } catch (error) { return handleDatabaseError(res, error, 'Could not update reaction'); }
}

async function deleteReaction(req, res) {
  try {
    const result = await pool.query('DELETE FROM reactions WHERE id = $1 RETURNING *', [req.params.id]);
    return result.rowCount ? res.json({ message: 'Reaction deleted', reaction: result.rows[0] }) : res.status(404).json({ error: 'Reaction not found' });
  } catch (error) { return handleDatabaseError(res, error, 'Could not delete reaction'); }
}

module.exports = { countReactions, myReaction, setReaction, deleteOwnReaction, listReactions, getReaction, updateReaction, deleteReaction };
