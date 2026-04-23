/* Simple utility to create an admin user in the SQLite DB.
   Usage: node scripts/create-admin.js --username admin --email admin@example.com --password secret
*/
const path = require('path');
const { db } = require('../src/db');
const bcrypt = require('bcryptjs');

function argvVal(name) {
    const idx = process.argv.indexOf('--' + name);
    return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const username = argvVal('username') || 'admin';
const email = argvVal('email') || 'admin@example.com';
const password = argvVal('password') || 'admin123';

if (!password) {
    console.error('Password required. Use --password');
    process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

try {
    const stmt = db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)');
    stmt.run(username, email, hash, 'admin');
    console.log('Admin user created:', username, email);
} catch (err) {
    console.error('Could not create admin user. Error:', err.message);
}
