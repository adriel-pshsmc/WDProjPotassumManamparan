const { wrap } = require('../_lib/session');

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const user = req.session.user || null;
  if (!user) return res.json({ authenticated: false });
  return res.json({ authenticated: true, user });
}

module.exports = wrap(handler);
