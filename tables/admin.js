const pool = require('../db');
const { handleDatabaseError } = require('../utils/api');

async function overview(_req, res) {
  try {
    const result = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM users) AS user_count,
         (SELECT COUNT(*)::int FROM posts) AS post_count,
         (SELECT COUNT(*)::int FROM posts WHERE status = 'published' AND deleted_at IS NULL) AS published_post_count,
         (SELECT COUNT(*)::int FROM posts WHERE status = 'draft' AND deleted_at IS NULL) AS draft_post_count,
         (SELECT COUNT(*)::int FROM posts WHERE deleted_at IS NOT NULL) AS trashed_post_count,
         (SELECT COUNT(*)::int FROM comments) AS comment_count,
         (SELECT COUNT(*)::int FROM reactions) AS reaction_count,
         pg_database_size(current_database())::text AS database_size_bytes,
         pg_size_pretty(pg_database_size(current_database())) AS database_size,
         (SELECT MAX(activity_at) FROM (
           SELECT MAX(updated_at) AS activity_at FROM posts
           UNION ALL SELECT MAX(updated_at) FROM comments
           UNION ALL SELECT MAX(created_at) FROM reactions
           UNION ALL SELECT MAX(created_at) FROM users
         ) AS activity) AS last_activity_at`,
    );
    return res.json({ overview: result.rows[0] });
  } catch (error) {
    return handleDatabaseError(res, error, 'Could not read the admin overview');
  }
}

module.exports = { overview };
