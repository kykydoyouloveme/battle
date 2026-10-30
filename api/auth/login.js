const bcrypt = require('bcryptjs');
const { createSession, getUsersCollection, methodNotAllowed, sendError, setSessionCookie } = require('../_lib/auth');

module.exports = async function login(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) return res.status(400).json({ error: 'Enter your email and password.' });
    const users = await getUsersCollection();
    const row = await users.findOne({ email });
    if (!row || !(await bcrypt.compare(password, row.passwordHash))) return res.status(401).json({ error: 'Incorrect email or password.' });
    const user = { id: row._id.toString(), username: row.username, email: row.email };
    setSessionCookie(res, createSession(user));
    return res.status(200).json({ user });
  } catch (error) {
    return sendError(res, error);
  }
};
