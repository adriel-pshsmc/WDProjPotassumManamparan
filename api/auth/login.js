const bcrypt = require('bcryptjs');
const { wrap } = require('../_lib/session');
const dbAdapter = require('../../src/db');

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ success: false, message: 'Missing' });

  try {
    let user = null;
    if (dbAdapter.mode === 'sqlite') {
      user = dbAdapter.db.prepare('SELECT id, username, email, password_hash, role FROM users WHERE email = ?').get(email);
    } else {
      const r = await dbAdapter.pg.pool.query('SELECT id, username, email, password_hash, role FROM users WHERE email = $1 LIMIT 1', [email]);
      user = r.rows[0] || null;
    }
    if (!user) return res.status(401).json({ success: false, message: 'Invalid' });
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid' });

    req.session.user = { id: user.id, username: user.username, role: user.role };
    await req.session.save();
    return res.json({ success: true, user: req.session.user });
  } catch (err) {
    console.error('login api error', err);
    return res.status(500).json({ success: false });
  }
}

module.exports = wrap(handler);
