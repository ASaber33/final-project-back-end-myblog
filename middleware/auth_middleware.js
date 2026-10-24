const crypto = require('crypto');
const pool = require('../db');

function sign(payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function createToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 bytes');
  }
  return sign({ sub: String(userId), iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 }, secret);
}

async function authenticate(req, res, next) {
  try {
    const [scheme, token, extra] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token || extra) return res.status(401).json({ error: 'Bearer token required' });
    const secret = process.env.JWT_SECRET;
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) return res.status(500).json({ error: 'Authentication is not configured' });
    const [payload, signature, trailing] = token.split('.');
    if (!payload || !signature || trailing) return res.status(401).json({ error: 'Invalid token' });
    const expected = crypto.createHmac('sha256', secret).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return res.status(401).json({ error: 'Invalid token' });
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (!decoded.sub || !Number.isInteger(decoded.exp) || decoded.exp <= now) return res.status(401).json({ error: 'Invalid or expired token' });
    const result = await pool.query('SELECT id, username, email, role, avatar_url, age, phone, created_at, must_change_password FROM users WHERE id = $1', [decoded.sub]);
    if (!result.rowCount) return res.status(401).json({ error: 'Invalid token' });
    req.user = result.rows[0];
    return next();
  } catch (error) {
    if (error.code) console.error('Authentication database error:', error.message);
    return res.status(error.code ? 503 : 401).json({ error: error.code ? 'Could not verify account' : 'Invalid token' });
  }
}

// Public routes use this so a feed can still report the viewer's own reaction.
// A broken or expired token degrades to a guest instead of failing the read.
async function optionalAuth(req, res, next) {
  if (!req.headers.authorization) {
    req.user = null;
    return next();
  }
  try {
    const [scheme, token, extra] = (req.headers.authorization || '').split(' ');
    const secret = process.env.JWT_SECRET;
    if (scheme !== 'Bearer' || !token || extra || !secret) {
      req.user = null;
      return next();
    }
    const [payload, signature, trailing] = token.split('.');
    if (!payload || !signature || trailing) {
      req.user = null;
      return next();
    }
    const expected = crypto.createHmac('sha256', secret).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
      req.user = null;
      return next();
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded.sub || !Number.isInteger(decoded.exp) || decoded.exp <= Math.floor(Date.now() / 1000)) {
      req.user = null;
      return next();
    }
    const result = await pool.query('SELECT id, username, email, role, avatar_url, age, phone, created_at, must_change_password FROM users WHERE id = $1', [decoded.sub]);
    req.user = result.rows[0] || null;
    return next();
  } catch {
    req.user = null;
    return next();
  }
}

module.exports = { authenticate, optionalAuth, createToken };
