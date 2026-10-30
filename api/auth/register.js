const bcrypt = require('bcryptjs');
const { createSession, getUsersCollection, methodNotAllowed, sendError, setSessionCookie } = require('../_lib/auth');

module.exports = async function register(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (username.length < 2 || username.length > 32) return res.status(400).json({ error: 'Username must be 2 to 32 characters.' });
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) return res.status(400).json({ error: 'Password must be at least 8 characters and no more than 72 bytes.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const users = await getUsersCollection();
    const result = await users.insertOne({ username, email, passwordHash, createdAt: new Date() });
    const user = { id: result.insertedId.toString(), username, email };
    setSessionCookie(res, createSession(user));
    return res.status(201).json({ user });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'An account with that email already exists.' });
    return sendError(res, error);
  }
};
