# Development Setup & Quickstart

This file contains quick setup and usage instructions for working with the project locally. I left `readme.md` untouched as requested and added this companion doc for developer convenience.

## macOS: Install SQLite CLI (Homebrew)

If you don't have Homebrew installed, follow https://brew.sh/ first. Then:

```bash
brew update
brew install sqlite
```

Verify the installation:

```bash
sqlite3 --version
```

Create an example DB and run a simple query:

```bash
# from the project root
mkdir -p data
sqlite3 data/dev.db "CREATE TABLE IF NOT EXISTS demo (id INTEGER PRIMARY KEY, name TEXT);"
sqlite3 data/dev.db "INSERT INTO demo (name) VALUES ('alice'), ('bob');"
sqlite3 data/dev.db "SELECT * FROM demo;"
```

## Node.js server (existing sample)

The repo includes a minimal Express + SQLite auth scaffold in `src/`.

```bash
# from project root
npm install
cp .env.example .env    # edit SESSION_SECRET at minimum for a non-dev environment
npm start
```

Optional: create an admin account (the project may include `scripts/create-admin.js`):

```bash
npm run create-admin -- --username admin --email admin@example.com --password S3curePa$$
```

Then open: http://localhost:3000/subpages/signin.html

## Python: tiny sqlite3 example (no external deps)

The `examples/python_sample.py` script shows how to create a SQLite DB, create a `users` table, insert a user (with PBKDF2-HMAC password hashing), and query it.

Run:

```bash
python3 examples/python_sample.py
```

## Browser: in-memory DB with sql.js

If you prefer an in-browser prototype, `sql.js` (SQLite compiled to WASM) lets you run SQL directly in the browser. A small outline is included in `examples/browser_sqljs.md` with a copy/paste HTML and JS snippet.

## Notes

- The project uses `data/dev.db` for Node's SQLite by default. Do not commit the `data/` DB file to git.
- For production you should use a managed Postgres DB (Neon, RDS, etc.) and set `DATABASE_URL`. See `README_FLASK.md` for an example of handling `DATABASE_URL` in Flask/SQLAlchemy.

If you'd like, I can now:
- Start the Node server and run a quick smoke test (login/signup/logout) and show the terminal output, or
- Add a small test script that performs those HTTP requests automatically.
