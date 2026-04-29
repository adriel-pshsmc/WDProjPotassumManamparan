/* Minimal Express server with SQLite-backed sessions and auth endpoints
   - GET /api/auth/me
   - POST /api/auth/login
   - POST /api/auth/logout
   On startup, this will apply the SQL migration if users table is missing.
*/

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

// DB adapter (sqlite or pg)
const dbAdapter = require('./db');
let DB_PATH = null;
let SQLiteStore = null;
let PgSessionStore = null;
let pgPool = null;

if (dbAdapter.mode === 'sqlite') {
    SQLiteStore = require('connect-sqlite3')(session);
    DB_PATH = dbAdapter.DB_PATH;
} else if (dbAdapter.mode === 'pg') {
    // Defer requiring connect-pg-simple until pg mode is active
    PgSessionStore = require('connect-pg-simple')(session);
    pgPool = dbAdapter.pg.pool;
}
const { requireAuth, allowRoles, allowSelfOrAdmin } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// session middleware using sqlite store
// Configure session store depending on DB mode
const sessionOptions = {
    name: process.env.SESSION_NAME || 'su_sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
};

if (dbAdapter.mode === 'pg') {
    sessionOptions.store = new PgSessionStore({ pool: pgPool, tableName: 'session' });
} else {
    SQLiteStore = SQLiteStore || require('connect-sqlite3')(session);
    sessionOptions.store = new SQLiteStore({ db: 'sessions.sqlite', dir: path.join(__dirname, '..', 'data') });
}

app.use(session(sessionOptions));

// Apply migration(s) if table missing
// Apply migrations for SQLite only (Postgres migrations should be handled externally)
function applyMigrations() {
    if (dbAdapter.mode === 'sqlite') {
        try {
            const row = dbAdapter.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
            if (!row) {
                const migrationsPath = path.join(__dirname, '..', 'migrations', '001_create_users.sql');
                const sql = fs.readFileSync(migrationsPath, 'utf8');
                dbAdapter.db.exec(sql);
                console.log('Applied migrations: created users table.');
            } else {
                console.log('Users table already exists.');
            }
        } catch (err) {
            console.error('Migration error', err);
            process.exit(1);
        }
    } else {
        console.log('Postgres mode detected: please run migrations on your Postgres/Neon database separately.');
    }
}

applyMigrations();

// helper: fetch user by email. Abstracted to support SQLite or Postgres.
async function findUserByEmail(email) {
    if (dbAdapter.mode === 'sqlite') {
        return dbAdapter.db.prepare('SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = ?').get(email);
    } else {
        const res = await pgPool.query('SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = $1 LIMIT 1', [email]);
        return res.rows[0] || null;
    }
}

// API: whoami
app.get('/api/auth/me', async (req, res) => {
    if (!req.session || !req.session.userId) return res.json({ authenticated: false });
    let user = null;
    if (dbAdapter.mode === 'sqlite') {
        user = dbAdapter.db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(req.session.userId);
    } else {
        const r = await pgPool.query('SELECT id, username, email, role, created_at FROM users WHERE id = $1 LIMIT 1', [req.session.userId]);
        user = r.rows[0] || null;
    }
    if (!user) return res.json({ authenticated: false });
    res.json({ authenticated: true, user });
});

// Example admin-only route (RBAC demo). This will return 403 if the session role isn't 'admin'.
app.get('/api/admin/check', allowRoles('admin'), (req, res) => {
    res.json({ success: true, message: 'You are an admin', userId: req.session.userId });
});

// API: signup
app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ success: false, message: 'Missing username, email or password' });

    // basic validation
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    try {
        if (dbAdapter.mode === 'sqlite') {
            const existing = dbAdapter.db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
            if (existing) return res.status(409).json({ success: false, message: 'Email or username already in use' });
            const password_hash = bcrypt.hashSync(password, 10);
            const stmt = dbAdapter.db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)');
            const info = stmt.run(username, email, password_hash, 'guest');
            const userId = info.lastInsertRowid;
            req.session.userId = userId;
            req.session.role = 'guest';
            return res.status(201).json({ success: true, user: { id: userId, username: username, email: email, role: 'guest' } });
        } else {
            // Postgres flow
            const r = await pgPool.query('SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1', [email, username]);
            if (r.rows && r.rows.length) return res.status(409).json({ success: false, message: 'Email or username already in use' });
            const password_hash = bcrypt.hashSync(password, 10);
            const insert = await pgPool.query('INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id', [username, email, password_hash, 'guest']);
            const userId = insert.rows[0].id;
            req.session.userId = userId;
            req.session.role = 'guest';
            return res.status(201).json({ success: true, user: { id: userId, username: username, email: email, role: 'guest' } });
        }
    } catch (err) {
        console.error('Signup error', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// API: login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing email or password' });

    try {
        const user = await findUserByEmail(email);
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const ok = bcrypt.compareSync(password, user.password_hash);
        if (!ok) {
            // increment failed_logins
            if (dbAdapter.mode === 'sqlite') {
                dbAdapter.db.prepare('UPDATE users SET failed_logins = failed_logins + 1 WHERE id = ?').run(user.id);
            } else {
                await pgPool.query('UPDATE users SET failed_logins = failed_logins + 1 WHERE id = $1', [user.id]);
            }
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // success: set session
        req.session.userId = user.id;
        req.session.role = user.role;
        res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Login error', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// API: logout
app.post('/api/auth/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) console.error('Session destroy error', err);
            res.json({ success: true });
        });
    } else res.json({ success: true });
});

// Serve static files (your existing static site)
app.use(express.static(path.join(__dirname, '..')));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} (mode: ${dbAdapter.mode}${DB_PATH ? ' DB: ' + DB_PATH : ''})`);
});
