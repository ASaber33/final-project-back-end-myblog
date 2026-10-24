require('dotenv').config();
const express = require('express');
const path = require('node:path');
const pool = require('./db');
const { authenticate, optionalAuth } = require('./middleware/auth_middleware');
const { requireAdmin } = require('./middleware/role_middleware');
const { validateId, handleDatabaseError } = require('./utils/api');
const { init, schemaReady } = require('./tables/schema');
const users = require('./user');
const posts = require('./tables/post');
const comments = require('./tables/comment');
const reactions = require('./tables/reaction');
const profile = require('./tables/profile');
const passwordReset = require('./tables/passwordReset');
const messages = require('./tables/messages');
const admin = require('./tables/admin');

const app = express();
const port = Number(process.env.PORT || 3100);
const frontendDist = path.join(__dirname, 'frontend', 'dist');
app.use(express.json({ limit: '100kb' }));

app.use(express.static(frontendDist));

app.get('/', (_req, res) => res.json({
  message: 'Blog API is running',
  routes: [
    '/register', '/login', '/profile', '/users', '/users/:id', '/users/:id/role', '/posts', '/posts/:id',
    '/me/posts', '/me/drafts', '/me/trash', '/admin/overview', '/admin/posts', '/admin/comments', '/posts/:id/status', '/posts/:id/restore', '/posts/:id/permanent',
    '/posts/:id/comments', '/comments', '/posts/:id/reaction', '/posts/:id/reactions', '/reactions', '/reactions/:id', '/health',
  ],
}));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check database error:', error.message);
    return res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});

// Static files and health checks should remain available while the database is starting.
app.use(schemaReady);

// Authentication and user administration.
app.post('/register', users.register);
app.post('/login', users.login);
app.post('/password/forgot', passwordReset.requestReset);
app.post('/password/reset', passwordReset.resetPassword);
app.get('/password/forgot/:accessKey/messages', messages.resetConversation);
app.get('/contact', messages.publicContact);
app.post('/contact/messages', optionalAuth, messages.sendPublicContactMessage);
app.post('/api/contact/messages', optionalAuth, messages.sendPublicContactMessage);
app.get('/messages', authenticate, messages.userMessages);
app.post('/messages', optionalAuth, messages.sendPublicContactMessage);
app.get('/admin/messages', authenticate, requireAdmin, messages.adminThreads);
app.get('/admin/messages/:id', authenticate, requireAdmin, messages.adminThreadMessages);
app.post('/admin/messages/:id', authenticate, requireAdmin, messages.sendAdminMessage);
app.delete('/admin/messages/:id', authenticate, requireAdmin, messages.deleteAdminThread);
app.delete('/admin/messages/:id/:messageId', authenticate, requireAdmin, messages.deleteAdminMessage);
app.post('/admin/messages/:id/reset-password', authenticate, requireAdmin, messages.sendResetCode);
app.get('/profile', authenticate, users.profile);
app.patch('/profile', authenticate, profile.updateProfile);
app.post('/password/change', authenticate, users.changePassword);
app.get('/users', authenticate, requireAdmin, users.listUsers);
app.get('/users/:id', authenticate, requireAdmin, validateId, users.getUser);
app.get('/users/:id/profile', validateId, profile.publicProfile);
app.patch('/users/:id/role', authenticate, requireAdmin, validateId, users.updateUserRole);
app.delete('/users/:id', authenticate, requireAdmin, validateId, users.deleteUser);

// Posts are public to read; the author or an admin can edit and delete.
app.get('/posts', optionalAuth, posts.listPosts);
app.get('/me/posts', authenticate, posts.myPosts);
app.get('/me/drafts', authenticate, posts.drafts);
app.get('/me/trash', authenticate, posts.trash);
app.get('/admin/overview', authenticate, requireAdmin, admin.overview);
app.get('/admin/posts', authenticate, requireAdmin, posts.adminPosts);
app.patch('/posts/:id/status', authenticate, validateId, posts.updateStatus);
app.post('/posts/:id/restore', authenticate, validateId, posts.restorePost);
app.delete('/posts/:id/permanent', authenticate, validateId, posts.purgePost);
app.get('/posts/:id', optionalAuth, validateId, posts.getPost);
app.post('/posts', authenticate, posts.createPost);
app.put('/posts/:id', authenticate, validateId, posts.updatePost);
app.patch('/posts/:id', authenticate, validateId, posts.updatePost);
app.delete('/posts/:id', authenticate, validateId, posts.deletePost);

// Comments are public to read; their author or an admin can edit/delete.
app.get('/posts/:id/comments', validateId, comments.listPostComments);
app.post('/posts/:id/comments', authenticate, validateId, comments.createComment);
app.get('/comments', comments.listComments);
app.get('/admin/comments', authenticate, requireAdmin, comments.adminComments);
app.get('/comments/:id', validateId, comments.getComment);
app.put('/comments/:id', authenticate, validateId, comments.updateComment);
app.patch('/comments/:id', authenticate, validateId, comments.updateComment);
app.delete('/comments/:id', authenticate, validateId, comments.deleteComment);

// Each signed-in user has one like/dislike per post; a repeat like toggles it off.
app.get('/posts/:id/reactions', validateId, reactions.countReactions);
app.get('/posts/:id/reaction', authenticate, validateId, reactions.myReaction);
app.put('/posts/:id/reaction', authenticate, validateId, reactions.setReaction);
app.delete('/posts/:id/reaction', authenticate, validateId, reactions.deleteOwnReaction);
app.get('/reactions', reactions.listReactions);
app.get('/reactions/:id', validateId, reactions.getReaction);
app.put('/reactions/:id', authenticate, requireAdmin, validateId, reactions.updateReaction);
app.patch('/reactions/:id', authenticate, requireAdmin, validateId, reactions.updateReaction);
app.delete('/reactions/:id', authenticate, requireAdmin, validateId, reactions.deleteReaction);

app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error('Request error:', error.message);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body' });
  if (error.code) return handleDatabaseError(res, error, 'Database request failed');
  return res.status(400).json({ error: 'Invalid request' });
});

async function start() {
  try {
    await init();
    console.log('Database schema is ready');
  } catch (error) {
    // Keep listening so /health can report the outage instead of the process dying.
    console.error('Database schema is not ready:', error.message);
  }
  app.listen(port, () => console.log(`Blog API running on http://localhost:${port}`));
}

if (require.main === module) start();

module.exports = app;
