const { getUsersCollection, methodNotAllowed, ObjectId, readSession, sendError } = require('../_lib/auth');

module.exports = async function me(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  try {
    const session = readSession(req);
    if (!session) return res.status(401).json({ error: 'Not signed in.' });
    if (!ObjectId.isValid(session.sub)) return res.status(401).json({ error: 'Not signed in.' });
    const users = await getUsersCollection();
    const row = await users.findOne({ _id: new ObjectId(session.sub) }, { projection: { username: 1, email: 1 } });
    if (!row) return res.status(401).json({ error: 'Not signed in.' });
    return res.status(200).json({ user: { id: row._id.toString(), username: row.username, email: row.email } });
  } catch (error) {
    return sendError(res, error);
  }
};
