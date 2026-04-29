const bcrypt = require('bcryptjs');
const { wrap } = require('../_lib/session');
const dbAdapter = require('../../src/db');

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });
  if (password.length < 8) return res.status(400).json({ success: false, message: 'Password too short' });

  try {
    if (dbAdapter.mode === 'sqlite') {
      const existing = dbAdapter.db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
      if (existing) return res.status(409).json({ success: false, message: 'Exists' });
      const password_hash = bcrypt.hashSync(password, 10);
      const info = dbAdapter.db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)').run(username, email, password_hash, 'guest');
      const userId = info.lastInsertRowid;
      req.session.user = { id: userId, username, role: 'guest' };
      await req.session.save();
      return res.status(201).json({ success: true, user: req.session.user });
    } else {
      const r = await dbAdapter.pg.pool.query('SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1', [email, username]);
      if (r.rows && r.rows.length) return res.status(409).json({ success: false, message: 'Exists' });
      const password_hash = bcrypt.hashSync(password, 10);
      const insert = await dbAdapter.pg.pool.query('INSERT INTO users (username, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id', [username, email, password_hash, 'guest']);
      const userId = insert.rows[0].id;
      req.session.user = { id: userId, username, role: 'guest' };
      await req.session.save();
      return res.status(201).json({ success: true, user: req.session.user });
    }
  } catch (err) {
    console.error('signup api error', err);
    return res.status(500).json({ success: false });
  }
}

module.exports = wrap(handler);
