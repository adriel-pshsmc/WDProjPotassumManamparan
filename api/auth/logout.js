const { wrap } = require('../_lib/session');

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  req.session.destroy();
  return res.json({ success: true });
}

module.exports = wrap(handler);
