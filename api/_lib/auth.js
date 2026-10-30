const crypto = require('node:crypto');
const { MongoClient, ObjectId } = require('mongodb');

const COOKIE_NAME = 'battleground_session';
const SESSION_SECONDS = 60 * 60 * 24 * 7;

async function getUsersCollection() {
  if (globalThis.__battlegroundUsers) return globalThis.__battlegroundUsers;
  const { MONGODB_URI, MONGODB_DB } = process.env;
  if (!MONGODB_URI || !MONGODB_DB) {
    const error = new Error('MongoDB environment variables are missing.');
    error.code = 'AUTH_NOT_CONFIGURED';
    throw error;
  }
  if (!globalThis.__battlegroundUsersPromise) {
    const client = new MongoClient(MONGODB_URI, { maxPoolSize: 5, serverSelectionTimeoutMS: 10000 });
    globalThis.__battlegroundUsersPromise = client.connect()
      .then(async () => {
        const users = client.db(MONGODB_DB).collection('users');
        await users.createIndex({ email: 1 }, { unique: true, name: 'users_email_unique' });
        globalThis.__battlegroundUsers = users;
        return users;
      })
      .catch(async error => {
        globalThis.__battlegroundUsersPromise = null;
        await client.close().catch(() => {});
        throw error;
      });
  }
  return globalThis.__battlegroundUsersPromise;
}

function secret() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    const error = new Error('SESSION_SECRET is missing or too short.');
    error.code = 'AUTH_NOT_CONFIGURED';
    throw error;
  }
  return process.env.SESSION_SECRET;
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function createSession(user) {
  const payload = Buffer.from(JSON.stringify({
    sub: String(user.id),
    username: user.username,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS
  })).toString('base64url');
  const content = `v1.${payload}`;
  return `${content}.${sign(content)}`;
}

function readSession(req) {
  const cookie = req.headers.cookie || '';
  const token = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  const content = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(sign(content));
  const received = Buffer.from(parts[2]);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!data.sub || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

function sendError(res, error) {
  console.error('Authentication API error:', error);
  if (error.code === 'AUTH_NOT_CONFIGURED') {
    return res.status(503).json({ error: 'The authentication service is not configured. Check the Vercel environment variables.' });
  }
  return res.status(500).json({ error: 'Server error. Please try again.' });
}

function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed);
  return res.status(405).json({ error: 'Method not allowed.' });
}

module.exports = { COOKIE_NAME, ObjectId, clearSessionCookie, createSession, getUsersCollection, methodNotAllowed, readSession, sendError, setSessionCookie };
