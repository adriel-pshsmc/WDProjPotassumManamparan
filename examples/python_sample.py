#!/usr/bin/env python3
"""
Small example: create a SQLite DB, create a users table, insert a user with PBKDF2-HMAC password hashing, and read it back.
Run: python3 examples/python_sample.py
"""
import sqlite3
import os
import hashlib
import binascii

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'py_example.db')

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def hash_password(password: str, salt: bytes = None):
    if salt is None:
        salt = os.urandom(16)
    pwd = password.encode('utf-8')
    dk = hashlib.pbkdf2_hmac('sha256', pwd, salt, 100_000)
    return binascii.hexlify(dk).decode('ascii'), binascii.hexlify(salt).decode('ascii')

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'guest'
);
''')
conn.commit()

# Insert a user
username = 'pyadmin'
email = 'pyadmin@example.com'
password = 'password123'
password_hash, salt = hash_password(password)

try:
    cur.execute('INSERT INTO users (username, email, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)',
                (username, email, password_hash, salt, 'admin'))
    conn.commit()
    print('Inserted user', username)
except sqlite3.IntegrityError:
    print('User already exists (skipping insert)')

# Read back
cur.execute('SELECT id, username, email, role FROM users')
rows = cur.fetchall()
print('Users in DB:')
for r in rows:
    print(r)

conn.close()
