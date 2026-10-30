const { clearSessionCookie, methodNotAllowed } = require('../_lib/auth');

module.exports = function logout(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
};
