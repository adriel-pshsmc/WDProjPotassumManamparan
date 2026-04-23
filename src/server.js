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
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcryptjs');

const { db, DB_PATH } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// session middleware using sqlite store
app.use(
    session({
        store: new SQLiteStore({ db: 'sessions.sqlite', dir: path.join(__dirname, '..', 'data') }),
        name: process.env.SESSION_NAME || 'su_sid',
        secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 1 day
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        }
    })
);

// Apply migration(s) if table missing
function applyMigrations() {
    try {
        const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
        if (!row) {
            const migrationsPath = path.join(__dirname, '..', 'migrations', '001_create_users.sql');
            const sql = fs.readFileSync(migrationsPath, 'utf8');
            db.exec(sql);
            console.log('Applied migrations: created users table.');
        } else {
            console.log('Users table already exists.');
        }
    } catch (err) {
        console.error('Migration error', err);
        process.exit(1);
    }
}

applyMigrations();

// helper: fetch user by email
function findUserByEmail(email) {
    return db.prepare('SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = ?').get(email);
}

// API: whoami
app.get('/api/auth/me', (req, res) => {
    if (!req.session || !req.session.userId) return res.json({ authenticated: false });
    const user = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(req.session.userId);
    if (!user) return res.json({ authenticated: false });
    res.json({ authenticated: true, user });
});

// API: signup
app.post('/api/auth/signup', (req, res) => {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ success: false, message: 'Missing username, email or password' });

    // basic validation
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    // check uniqueness
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) return res.status(409).json({ success: false, message: 'Email or username already in use' });

    const password_hash = bcrypt.hashSync(password, 10);
    try {
        const stmt = db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)');
        const info = stmt.run(username, email, password_hash, 'guest');
        const userId = info.lastInsertRowid;
        // create session
        req.session.userId = userId;
        req.session.role = 'guest';
        res.status(201).json({ success: true, user: { id: userId, username: username, email: email, role: 'guest' } });
    } catch (err) {
        console.error('Signup error', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// API: login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing email or password' });

    const user = findUserByEmail(email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) {
        // increment failed_logins
        db.prepare('UPDATE users SET failed_logins = failed_logins + 1 WHERE id = ?').run(user.id);
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // success: set session
    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
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
    console.log(`Server running on http://localhost:${PORT} (DB: ${DB_PATH})`);
});
