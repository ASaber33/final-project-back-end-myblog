const pool = require('../db');
const { validText, validDraftText, ownsOrAdmin, isAdmin, handleDatabaseError } = require('../utils/api');

const PUBLIC_FIELDS = 'p.id, p.user_id, u.username, u.avatar_url, p.title, p.content, p.status, p.created_at, p.updated_at, p.deleted_at';

// Every read filters on the post's own state, so drafts and trashed posts never
// leak into the public feed.
const VISIBLE = "p.status = 'published' AND p.deleted_at IS NULL";

async function listPosts(req, res) {
  const scope = req.query.scope === 'mine' ? 'mine' : 'all';
  const viewer = req.user?.id || 0;
  try {
    const result = await pool.query(
      `SELECT ${PUBLIC_FIELDS},
         (SELECT COUNT(*)::int FROM reactions r WHERE r.post_id = p.id AND r.type = 'like') AS like_count,
         (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count,
         (SELECT r.type FROM reactions r WHERE r.post_id = p.id AND r.user_id = $1 ORDER BY r.id LIMIT 1) AS my_reaction
       FROM posts p JOIN users u ON u.id = p.user_id
       WHERE ${VISIBLE} AND ($2::boolean = false OR p.user_id = $1)
       ORDER BY p.created_at DESC, p.id DESC`,
      [viewer, scope === 'mine'],
    );
    return res.json({ posts: result.rows });
  } catch (error) { return handleDatabaseError(res, error, 'Could not read posts'); }
}

async function adminPosts(_req, res) {
  try {
    const result = await pool.query(
      `SELECT ${PUBLIC_FIELDS},
         (SELECT COUNT(*)::int FROM reactions r WHERE r.post_id = p.id AND r.type = 'like') AS like_count,
         (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p JOIN users u ON u.id = p.user_id
       ORDER BY COALESCE(p.deleted_at, p.updated_at) DESC, p.id DESC`,
    );
    return res.json({ posts: result.rows });
  } catch (error) { return handleDatabaseError(res, error, 'Could not read content for administration'); }
}

async function getPost(req, res) {
  const viewer = req.user?.id || 0;
  const admin = isAdmin(req);
  try {
    const result = await pool.query(
      `SELECT ${PUBLIC_FIELDS},
         (SELECT COUNT(*)::int FROM reactions r WHERE r.post_id = p.id AND r.type = 'like') AS like_count,
         (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count,
         (SELECT r.type FROM reactions r WHERE r.post_id = p.id AND r.user_id = $1 ORDER BY r.id LIMIT 1) AS my_reaction
       FROM posts p JOIN users u ON u.id = p.user_id
       WHERE p.id = $2 AND (${VISIBLE} OR p.user_id = $1 OR $3::boolean = true)`,
      [viewer, req.params.id, admin],
    );
    return result.rowCount ? res.json({ post: result.rows[0] }) : res.status(404).json({ error: 'Post not found' });
  } catch (error) { return handleDatabaseError(res, error, 'Could not read post'); }
}

async function createPost(req, res) {
  const { title, content } = req.body || {};
  const status = req.body?.status === 'draft' ? 'draft' : 'published';
  const titleOk = status === 'draft' ? validDraftText(title, 200) : validText(title, 200);
  const contentOk = status === 'draft' ? validDraftText(content, 50000) : validText(content, 50000);
  if (!titleOk) return res.status(400).json({ error: 'title must be 1 to 200 characters' });
  if (!contentOk) return res.status(400).json({ error: 'content must be 1 to 50000 characters' });
  if (status === 'draft' && !validText(title, 200) && !validText(content, 50000)) {
    return res.status(400).json({ error: 'a draft needs a title or a body' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO posts (user_id, title, content, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, (title || '').trim(), (content || '').trim(), status],
    );
    return res.status(201).json({ post: result.rows[0] });
  } catch (error) { return handleDatabaseError(res, error, 'Could not create post'); }
}

// The author or an admin may delete; trashed posts are already gone.
async function deletePost(req, res) {
  try {
    const existing = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Post not found' });
    const post = existing.rows[0];
    if (!ownsOrAdmin(req, post.user_id)) return res.status(403).json({ error: 'You can only delete your own posts' });
    if (post.deleted_at) return res.status(409).json({ error: 'Post is already in the trash' });
    const result = await pool.query('UPDATE posts SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *', [req.params.id]);
    return res.json({ message: 'Post moved to trash', post: result.rows[0] });
  } catch (error) { return handleDatabaseError(res, error, 'Could not delete post'); }
}

async function updatePost(req, res) {
  const { title, content } = req.body || {};
  if (!validText(title, 200) || !validText(content, 50000)) return res.status(400).json({ error: 'title (1-200 chars) and content (1-50000 chars) are required' });
  try {
    const existing = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Post not found' });
    const post = existing.rows[0];
    if (!ownsOrAdmin(req, post.user_id)) return res.status(403).json({ error: 'You can only edit your own posts' });
    if (post.deleted_at) return res.status(409).json({ error: 'Restore the post before editing it' });
    const status = req.body?.status === 'draft' || req.body?.status === 'published' ? req.body.status : post.status;
    const updated = await pool.query(
      'UPDATE posts SET title = $1, content = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [title.trim(), content.trim(), status, req.params.id],
    );
    return res.json({ post: updated.rows[0] });
  } catch (error) { return handleDatabaseError(res, error, 'Could not update post'); }
}

async function updateStatus(req, res) {
  const { status } = req.body || {};
  if (!['draft', 'published'].includes(status)) return res.status(400).json({ error: 'status must be draft or published' });
  try {
    const existing = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Post not found' });
    const post = existing.rows[0];
    if (!ownsOrAdmin(req, post.user_id)) return res.status(403).json({ error: 'You can only change your own posts' });
    if (post.deleted_at) return res.status(409).json({ error: 'Restore the post before publishing it' });
    if (status === 'published' && (!validText(post.title, 200) || !validText(post.content, 50000))) {
      return res.status(400).json({ error: 'Add a title and a body before publishing' });
    }
    const result = await pool.query('UPDATE posts SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, req.params.id]);
    return res.json({ post: result.rows[0] });
  } catch (error) { return handleDatabaseError(res, error, 'Could not update post status'); }
}

async function listMine(req, res, where, label) {
  const admin = isAdmin(req);
  try {
    const result = await pool.query(
      `SELECT ${PUBLIC_FIELDS},
         (SELECT COUNT(*)::int FROM reactions r WHERE r.post_id = p.id AND r.type = 'like') AS like_count,
         (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p JOIN users u ON u.id = p.user_id
       WHERE ${where} AND (p.user_id = $1 OR $2::boolean = true)
       ORDER BY COALESCE(p.deleted_at, p.updated_at) DESC, p.id DESC`,
      [req.user.id, admin],
    );
    return res.json({ posts: result.rows });
  } catch (error) { return handleDatabaseError(res, error, label); }
}

function myPosts(req, res) {
  return listMine(req, res, 'p.deleted_at IS NULL', 'Could not read your posts');
}

function drafts(req, res) {
  return listMine(req, res, "p.status = 'draft' AND p.deleted_at IS NULL", 'Could not read drafts');
}

function trash(req, res) {
  return listMine(req, res, 'p.deleted_at IS NOT NULL', 'Could not read trash');
}

async function restorePost(req, res) {
  try {
    const existing = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Post not found' });
    const post = existing.rows[0];
    if (!ownsOrAdmin(req, post.user_id)) return res.status(403).json({ error: 'You can only restore your own posts' });
    if (!post.deleted_at) return res.status(409).json({ error: 'Post is not in the trash' });
    const result = await pool.query('UPDATE posts SET deleted_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING *', [req.params.id]);
    return res.json({ message: 'Post restored', post: result.rows[0] });
  } catch (error) { return handleDatabaseError(res, error, 'Could not restore post'); }
}

// Permanent deletion is only reachable from the trash, so live posts stay safe.
// The existing schema declares NO ACTION keys on comments/post reactions, so the
// dependents are removed here — otherwise any post with a comment can never be purged.
async function purgePost(req, res) {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM posts WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!existing.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Post not found' }); }
    const post = existing.rows[0];
    if (!ownsOrAdmin(req, post.user_id)) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'You can only delete your own posts' }); }
    if (!post.deleted_at) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Move the post to the trash before deleting it permanently' }); }
    await client.query('DELETE FROM reactions WHERE post_id = $1', [req.params.id]);
    await client.query('DELETE FROM comments WHERE post_id = $1', [req.params.id]);
    await client.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    return res.json({ message: 'Post permanently deleted' });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    return handleDatabaseError(res, error, 'Could not permanently delete post');
  } finally { client?.release(); }
}

module.exports = {
  listPosts, adminPosts, getPost, createPost, updatePost, updateStatus, deletePost,
  myPosts, drafts, trash, restorePost, purgePost,
};
