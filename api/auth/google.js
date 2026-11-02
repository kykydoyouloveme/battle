const { OAuth2Client } = require('google-auth-library');
const { createSession, getUsersCollection, methodNotAllowed, sendError, setSessionCookie } = require('../_lib/auth');

module.exports = async function googleSignIn(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: 'Google sign-in is not configured. Add GOOGLE_CLIENT_ID in Vercel settings.' });

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (typeof body.credential !== 'string' || body.credential.length > 10000) {
      return res.status(400).json({ error: 'Google did not return a valid sign-in credential.' });
    }
    const googleClient = globalThis.__battlegroundGoogleClient ||= new OAuth2Client(clientId);
    const ticket = await googleClient.verifyIdToken({ idToken: body.credential, audience: clientId });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || profile.email_verified !== true) {
      return res.status(401).json({ error: 'Use a Google Account with a verified email address.' });
    }

    const users = await getUsersCollection();
    const email = profile.email.toLowerCase();
    let user = await users.findOne({ googleId: profile.sub });

    if (!user) {
      const existingEmail = await users.findOne({ email });
      if (existingEmail) {
        if (existingEmail.googleId && existingEmail.googleId !== profile.sub) {
          return res.status(409).json({ error: 'This email is already connected to a different Google Account.' });
        }
        await users.updateOne({ _id: existingEmail._id }, { $set: { googleId: profile.sub, authProvider: 'google' } });
        user = { ...existingEmail, googleId: profile.sub, authProvider: 'google' };
      } else {
        const username = (profile.name || email.split('@')[0]).slice(0, 32);
        const result = await users.insertOne({ googleId: profile.sub, authProvider: 'google', username, email, createdAt: new Date() });
        user = { _id: result.insertedId, username, email };
      }
    }

    const responseUser = { id: user._id.toString(), username: user.username, email: user.email };
    setSessionCookie(res, createSession(responseUser));
    return res.status(200).json({ user: responseUser });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'This Google Account is already registered.' });
    return sendError(res, error);
  }
};
