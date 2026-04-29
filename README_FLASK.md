Flask & SQLAlchemy: Neon (Postgres) migration notes
===============================================

This project contains a small Flask example and a configuration helper to make
migrating from a local SQLite development DB to a hosted Postgres DB (like
Neon) straightforward.

Files added:
- `config.py` — helper: `get_database_uri()` reads `DATABASE_URL`, replaces
  `postgres://` with `postgresql://` for SQLAlchemy compatibility, and falls
  back to `sqlite:///site.db`.
- `flask_app.py` — minimal example Flask app using `config.get_sqlalchemy_config()`.
- `requirements.txt` — Python dependencies for Flask + SQLAlchemy + psycopg2.

Local development
-----------------
1. Copy `.env.example` to `.env` and customize as needed.
2. If you don't set `DATABASE_URL`, the app will use a local `site.db` file.
3. Create and activate a Python virtualenv, install requirements:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the example app:

```bash
python flask_app.py
# then open http://127.0.0.1:5000
```

Deploying to Vercel + Neon
-------------------------
1. Create a Neon Postgres database and copy the `DATABASE_URL` connection string
   into your Vercel project environment variables.
2. On Vercel make sure your Python runtime is configured and the `DATABASE_URL`
   variable is present. The `config.get_database_uri()` function will convert
   legacy `postgres://` to `postgresql://` automatically.

Notes
-----
- If your provider requires SSL or additional connection parameters, you may
  need to adjust SQLAlchemy engine options (for example adding connect_args
  or using a specific pool class). Neon is serverless and sometimes requires
  explicit SSL parameters depending on the client you use.
- The `psycopg2-binary` driver is fine for most deployments; for production
  consider `psycopg[binary]` or `psycopg` with appropriate packaging.
