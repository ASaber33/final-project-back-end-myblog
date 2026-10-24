const pool = require('../db');

// Existing installations predate drafts and the trash bin, so the two columns
// are added idempotently and everything else waits on this promise.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
     id SERIAL PRIMARY KEY,
     username TEXT NOT NULL,
     email TEXT NOT NULL UNIQUE,
     password BYTEA NOT NULL,
     role TEXT NOT NULL DEFAULT 'user',
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS posts (
     id SERIAL PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     content TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS comments (
     id SERIAL PRIMARY KEY,
     post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS reactions (
     id SERIAL PRIMARY KEY,
     post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     type TEXT NOT NULL DEFAULT 'like',
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
   `ALTER TABLE users ADD COLUMN IF NOT EXISTS age SMALLINT`,
   `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`,
  `CREATE TABLE IF NOT EXISTS password_resets (
     id SERIAL PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     code_hash TEXT NOT NULL,
     expires_at TIMESTAMPTZ NOT NULL,
     used_at TIMESTAMPTZ
   )`,
  `CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets (user_id)`,
  `CREATE TABLE IF NOT EXISTS support_threads (
     id SERIAL PRIMARY KEY,
     user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
     guest_token_hash TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS guest_name TEXT`,
  `ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS guest_email TEXT`,
  `ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS admin_last_read_at TIMESTAMPTZ`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE`,
  `CREATE TABLE IF NOT EXISTS support_messages (
     id SERIAL PRIMARY KEY,
     thread_id INTEGER NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
     sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
     sender_role TEXT NOT NULL CHECK (sender_role IN ('guest', 'user', 'admin')),
     body TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS support_messages_thread_idx ON support_messages (thread_id, created_at, id)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
  `CREATE INDEX IF NOT EXISTS posts_user_status_idx ON posts (user_id, status)`,
  `CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments (post_id)`,
  `CREATE INDEX IF NOT EXISTS reactions_post_user_type_idx ON reactions (post_id, user_id, type)`,
  `CREATE INDEX IF NOT EXISTS posts_deleted_at_idx ON posts (deleted_at)`,
];

let ready;
let failed = null;

function init() {
  if (!ready) {
    ready = (async () => {
      for (const statement of STATEMENTS) {
        // With a pooler each statement may land on a different backend, so a
        // missing column must be re-checked one statement at a time.
        for (let attempt = 1; ; attempt += 1) {
          try {
            await pool.query(statement);
            break;
          } catch (error) {
            if (attempt >= 3 || !['42P01', '42703', '23505'].includes(error.code)) throw error;
          }
        }
      }
      return true;
    })().catch((error) => {
      failed = error;
      throw error;
    });
    ready.catch(() => {});
  }
  return ready;
}

async function schemaReady(_req, res, next) {
  if (failed) {
    console.error('Schema initialization failed:', failed.message);
    return res.status(503).json({ error: 'Database schema is not ready' });
  }
  try {
    await init();
    return next();
  } catch (error) {
    console.error('Schema initialization failed:', error.message);
    return res.status(503).json({ error: 'Database schema is not ready' });
  }
}

module.exports = { init, schemaReady, statements: STATEMENTS };
