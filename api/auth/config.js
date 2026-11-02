const { methodNotAllowed } = require('../_lib/auth');

module.exports = function config(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  return res.status(200).json({ clientId: process.env.GOOGLE_CLIENT_ID || null });
};
